import { ApiError } from '../errors'
import type { ServiceName, SessionPort } from '../httpClient'
import { parseProblem } from '../problemDetail'
import { parseSseChunk } from './parseSseChunk'

export type StreamState = 'connecting' | 'open' | 'reconnecting'

export interface StreamEvent {
  name: string
  /** Parsed JSON of the event data. */
  data: unknown
}

export interface StreamHandlers {
  onEvent(event: StreamEvent): void
  onState?(state: StreamState): void
  /** The stream ended for good (bad filters, forbidden, session gone...). It is never reopened after this. */
  onFatal(error: ApiError): void
}

export interface SseClientConfig {
  baseUrls: Record<ServiceName, string>
  session: SessionPort
  fetchImpl?: typeof fetch
  sleep?: (ms: number, signal: AbortSignal) => Promise<void>
  origin?: string
  /** Waiting for the first byte can take long: the BFF may still be preparing the batch. */
  openTimeoutMs?: number
  /** Heartbeats arrive well within this window; silence means the connection is dead. */
  inactivityMs?: number
}

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']
const MAX_BACKOFF_MS = 30_000

function defaultSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve()
    const timer = setTimeout(() => { signal.removeEventListener('abort', done); resolve() }, ms)
    const done = () => { clearTimeout(timer); resolve() }
    signal.addEventListener('abort', done, { once: true })
  })
}

/**
 * Server-Sent Events over `fetch`, so the JWT travels in the Authorization header and never in the URL (BR-23).
 * The connection stays open; when it drops it is reopened with an exponential backoff, and filters are fixed
 * at open time (BR-06): to change them, abort and call `connect` again.
 */
export function createSseClient(config: SseClientConfig) {
  const fetchImpl = config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const sleep = config.sleep ?? defaultSleep
  const openTimeoutMs = config.openTimeoutMs ?? 190_000
  const inactivityMs = config.inactivityMs ?? 90_000

  function buildUrl(service: ServiceName, path: string, query: Record<string, string | undefined>): URL {
    const origin = config.origin ?? (typeof location === 'undefined' ? 'http://localhost' : location.origin)
    const url = new URL(`${config.baseUrls[service]}${path}`, origin)
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && LOCAL_HOSTS.includes(url.hostname))) {
      throw new ApiError('Não foi possível estabelecer uma conexão segura.', { kind: 'config' })
    }
    for (const [key, value] of Object.entries(query)) if (value) url.searchParams.set(key, value)
    return url
  }

  async function connect(
    service: ServiceName, path: string,
    options: { query?: Record<string, string | undefined>; signal: AbortSignal; handlers: StreamHandlers },
  ): Promise<void> {
    const { signal, handlers } = options
    let url: URL
    try {
      url = buildUrl(service, path, options.query ?? {})
    } catch (error) {
      handlers.onFatal(error instanceof ApiError ? error : new ApiError('Endereço inválido.', { kind: 'config' }))
      return
    }
    let attempt = 0
    let renewedAfter401 = false

    while (!signal.aborted) {
      handlers.onState?.(attempt === 0 && !renewedAfter401 ? 'connecting' : 'reconnecting')
      const token = config.session.getAccessToken()
      if (!token) {
        config.session.onExpired()
        handlers.onFatal(new ApiError('Sessão expirada. Entre novamente.', { kind: 'session', status: 401 }))
        return
      }
      const connection = new AbortController()
      const onOuterAbort = () => connection.abort()
      signal.addEventListener('abort', onOuterAbort, { once: true })
      let idleTimer: ReturnType<typeof setTimeout> | undefined = setTimeout(() => connection.abort(new DOMException('timeout', 'TimeoutError')), openTimeoutMs)
      const arm = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => connection.abort(new DOMException('silence', 'TimeoutError')), inactivityMs) }
      let receivedData = false
      try {
        const headers: Record<string, string> = { Accept: 'text/event-stream', Authorization: `Bearer ${token}` }
        const unit = config.session.getUnitId()
        if (unit) headers['X-Unit-Id'] = unit
        const response = await fetchImpl(url, { method: 'GET', headers, signal: connection.signal, credentials: 'omit', redirect: 'error', cache: 'no-store' })

        if (!response.ok) {
          const problem = parseProblem(await response.json().catch(() => undefined))
          if (response.status === 401 && !renewedAfter401 && await config.session.refresh()) { renewedAfter401 = true; continue }
          if (response.status === 401 || response.status === 403) config.session.onExpired()
          if ([502, 503, 504].includes(response.status)) throw new ApiError(`HTTP ${response.status}`, { kind: 'http', status: response.status })
          handlers.onFatal(new ApiError(problem.detail ?? `HTTP ${response.status}`, { kind: response.status === 401 ? 'session' : 'http', status: response.status, ...problem }))
          return
        }
        if (!response.headers.get('content-type')?.toLowerCase().includes('text/event-stream') || !response.body) {
          handlers.onFatal(new ApiError('O servidor não retornou um stream text/event-stream válido.', { kind: 'contract', status: response.status }))
          return
        }

        renewedAfter401 = false
        handlers.onState?.('open')
        arm()
        const reader = response.body.getReader()
        // Aborting (by the caller or by the silence timer) must also release a read that is waiting for bytes.
        connection.signal.addEventListener('abort', () => { void reader.cancel().catch(() => undefined) }, { once: true })
        const decoder = new TextDecoder()
        let buffer = ''
        try {
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            arm()
            const parsed = parseSseChunk(buffer, decoder.decode(value, { stream: true }))
            buffer = parsed.rest
            for (const raw of parsed.events) {
              if (!['snapshot', 'unavailable', 'error'].includes(raw.event)) continue
              let data: unknown
              try {
                data = JSON.parse(raw.data)
              } catch {
                handlers.onFatal(new ApiError('O stream enviou um evento com JSON inválido.', { kind: 'contract' }))
                return
              }
              receivedData = true
              if (raw.event === 'error') {
                const problem = parseProblem(data)
                const status = typeof (data as { status?: unknown })?.status === 'number' ? (data as { status: number }).status : 0
                if (status === 401 || status === 403) config.session.onExpired()
                handlers.onFatal(new ApiError(problem.detail ?? 'O servidor encerrou o stream com erro.', { kind: 'http', status, ...problem }))
                return
              }
              handlers.onEvent({ name: raw.event, data })
            }
          }
        } finally {
          await reader.cancel().catch(() => undefined)
        }
      } catch (error) {
        if (signal.aborted) return
        if (!(error instanceof DOMException) && !(error instanceof TypeError) && !(error instanceof ApiError)) throw error
      } finally {
        clearTimeout(idleTimer)
        idleTimer = undefined
        signal.removeEventListener('abort', onOuterAbort)
      }
      if (signal.aborted) return
      attempt = receivedData ? 1 : attempt + 1
      handlers.onState?.('reconnecting')
      await sleep(Math.min(1000 * 2 ** (attempt - 1), MAX_BACKOFF_MS), signal)
    }
  }

  return { connect }
}

export type SseClient = ReturnType<typeof createSseClient>
