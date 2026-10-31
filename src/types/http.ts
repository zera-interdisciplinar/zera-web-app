import type { ZodType } from 'zod'
import type { createHttpClient } from '../services/httpClient'
import type { createSseClient } from '../services/sseClient'
import type { ApiError } from '../utils/apiError'

export type QueryValue = string | number | boolean | null | undefined

export type ServiceName = 'administrative' | 'inventory' | 'analytics'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

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
  /** Uses this token instead of the session's (right after login, before the session exists). A 401 is not renewed. */
  accessToken?: string
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

export type HttpClient = ReturnType<typeof createHttpClient>

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

export type SseClient = ReturnType<typeof createSseClient>

export type ApiErrorKind =
  /** The request never reached the server (offline, DNS, CORS). */
  | 'network'
  | 'timeout'
  /** The server answered with a non-2xx status. */
  | 'http'
  /** The server answered 2xx but the body does not match the contract (BR-24). */
  | 'contract'
  /** Missing or invalid client configuration (for example, no unit on the account). */
  | 'config'
  /** The session is gone or could not be renewed. */
  | 'session'

export interface ApiErrorInit {
  kind: ApiErrorKind
  status?: number
  title?: string
  detail?: string
  fieldErrors?: Record<string, string>
  missingFields?: string[]
  cause?: unknown
}

export type Page<Item> = {
  content: Item[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Problem {
  title?: string
  detail?: string
  fieldErrors: Record<string, string>
  missingFields: string[]
}

export interface RawSseEvent {
  event: string
  data: string
}

export interface AppEnv {
  apiBaseUrls: {
    administrative: string
    inventory: string
    analytics: string
  }
}
