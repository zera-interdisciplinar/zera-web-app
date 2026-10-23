import type { ZodType } from 'zod'
import { ApiError } from './errors'
import { parseProblem } from './problemDetail'

export type ServiceName = 'administrative' | 'inventory' | 'analytics'
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
type QueryValue = string | number | boolean | null | undefined

/** What the HTTP client needs from the session. The auth layer implements it (PR 4). */
export interface SessionPort {
  getAccessToken(): string | null
  /** Unit of the signed-in user, sent as `X-Unit-Id` (BR-09). */
  getUnitId(): string | null
  /** Renews the tokens. Resolves `false` when the session cannot continue. */
  refresh(): Promise<boolean>
  /** Called once the session is definitively gone (second 401 or failed refresh). */
  onExpired(): void
}

export interface RequestOptions<T> {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, QueryValue>
  signal?: AbortSignal
  /** Validates the response body (L3). Without a schema the body is returned as `unknown`. */
  schema?: ZodType<T>
  /** Sends the bearer token. Defaults to true; login, refresh and password reset pass false. */
  auth?: boolean
  /** Sends `X-Unit-Id`. Defaults to true only for the inventory service. */
  unit?: boolean
  timeoutMs?: number
}

export interface HttpClientConfig {
  baseUrls: Record<ServiceName, string>
  session: SessionPort
  fetchImpl?: typeof fetch
  /** Overridable so tests do not wait for the backoff. */
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>
  /** Origin used to resolve same-origin paths. Defaults to the page origin. */
  origin?: string
}

const DEFAULT_TIMEOUT_MS = 15_000
const MAX_RETRIES = 2
const RETRYABLE_STATUS = [502, 503, 504]
const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new DOMException('Request aborted.', 'AbortError'))
    const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve() }, ms)
    const onAbort = () => { clearTimeout(timer); reject(new DOMException('Request aborted.', 'AbortError')) }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function hasUnitInBody(body: unknown): boolean {
  return typeof body === 'object' && body !== null && !Array.isArray(body)
    && Object.keys(body).some((key) => key.toLowerCase() === 'unitid')
}

export function createHttpClient(config: HttpClientConfig) {
  const fetchImpl = config.fetchImpl ?? ((...args: Parameters<typeof fetch>) => fetch(...args))
  const sleep = config.sleep ?? defaultSleep
  let refreshing: Promise<boolean> | null = null

  function buildUrl(service: ServiceName, path: string, query?: Record<string, QueryValue>): URL {
    const origin = config.origin ?? (typeof location === 'undefined' ? 'http://localhost' : location.origin)
    const url = new URL(`${config.baseUrls[service]}${path}`, origin)
    const secure = url.protocol === 'https:' || (url.protocol === 'http:' && LOCAL_HOSTS.includes(url.hostname))
    if (!secure) throw new ApiError('A API remota exige HTTPS.', { kind: 'config' })
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
    }
    return url
  }

  /** Single-flight: concurrent 401s share one refresh (the backend rotates the refresh token). */
  function refreshOnce(): Promise<boolean> {
    refreshing ??= config.session.refresh().catch(() => false).finally(() => { refreshing = null })
    return refreshing
  }

  async function send(url: URL, service: ServiceName, options: RequestOptions<unknown>, token: string | null): Promise<Response> {
    const method = options.method ?? 'GET'
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (options.body !== undefined) headers['Content-Type'] = 'application/json'
    if (token) headers.Authorization = `Bearer ${token}`
    if (options.unit ?? service === 'inventory') {
      const unitId = config.session.getUnitId()
      if (!unitId) throw new ApiError('A conta não possui unidade de inventário.', { kind: 'config' })
      headers['X-Unit-Id'] = unitId
    }
    const body = options.body === undefined ? undefined : JSON.stringify(options.body)
    for (let attempt = 0; ; attempt += 1) {
      // The timeout applies to each attempt, not to the whole retry sequence.
      const signals = [AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS), ...(options.signal ? [options.signal] : [])]
      try {
        const response = await fetchImpl(url, {
          method, headers, body, signal: AbortSignal.any(signals), credentials: 'omit', redirect: 'error', cache: 'no-store',
        })
        if (method !== 'GET' || !RETRYABLE_STATUS.includes(response.status) || attempt >= MAX_RETRIES) return response
        await response.body?.cancel()
      } catch (error) {
        if (options.signal?.aborted) throw error
        const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
        if (method !== 'GET' || attempt >= MAX_RETRIES) {
          throw new ApiError(
            timedOut ? 'A requisição excedeu o tempo limite.' : 'Não foi possível acessar a API.',
            { kind: timedOut ? 'timeout' : 'network', cause: error },
          )
        }
      }
      await sleep(300 * 2 ** attempt, options.signal)
    }
  }

  async function readBody(response: Response): Promise<unknown> {
    if (response.status === 204) return undefined
    const text = await response.text()
    if (text === '') return undefined
    try {
      return JSON.parse(text)
    } catch (error) {
      throw new ApiError('A API retornou uma resposta inválida.', { kind: 'contract', status: response.status, cause: error })
    }
  }

  async function toHttpError(response: Response): Promise<ApiError> {
    let body: unknown
    try { body = JSON.parse(await response.text()) } catch { body = undefined }
    const problem = parseProblem(body)
    return new ApiError(problem.detail ?? `HTTP ${response.status}`, { kind: 'http', status: response.status, ...problem })
  }

  async function request<T = unknown>(service: ServiceName, path: string, options: RequestOptions<T> = {}): Promise<T> {
    if (hasUnitInBody(options.body)) {
      throw new ApiError('O unitId vai no header X-Unit-Id, nunca no corpo.', { kind: 'config' })
    }
    const url = buildUrl(service, path, options.query)
    const authenticated = options.auth !== false
    let token = authenticated ? config.session.getAccessToken() : null
    if (authenticated && !token) throw new ApiError('Sessão expirada. Entre novamente.', { kind: 'session', status: 401 })

    let response = await send(url, service, options, token)
    if (response.status === 401 && authenticated) {
      await response.body?.cancel()
      const renewed = await refreshOnce()
      token = renewed ? config.session.getAccessToken() : null
      if (!token) {
        config.session.onExpired()
        throw new ApiError('Sessão expirada. Entre novamente.', { kind: 'session', status: 401 })
      }
      response = await send(url, service, options, token)
      if (response.status === 401) {
        await response.body?.cancel()
        config.session.onExpired()
        throw new ApiError('Sessão expirada. Entre novamente.', { kind: 'session', status: 401 })
      }
    }
    if (!response.ok) throw await toHttpError(response)

    const body = await readBody(response)
    if (!options.schema) return body as T
    const parsed = options.schema.safeParse(body)
    if (!parsed.success) {
      const issues = parsed.error.issues.slice(0, 5).map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`).join('; ')
      throw new ApiError('Resposta fora do contrato.', { kind: 'contract', status: response.status, detail: issues })
    }
    return parsed.data
  }

  return { request }
}

export type HttpClient = ReturnType<typeof createHttpClient>
