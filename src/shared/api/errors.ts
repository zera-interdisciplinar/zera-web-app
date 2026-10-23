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

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number
  readonly title?: string
  readonly detail?: string
  readonly fieldErrors: Record<string, string>
  readonly missingFields: string[]

  constructor(message: string, init: ApiErrorInit) {
    super(message, { cause: init.cause })
    this.name = 'ApiError'
    this.kind = init.kind
    this.status = init.status ?? 0
    this.title = init.title
    this.detail = init.detail
    this.fieldErrors = init.fieldErrors ?? {}
    this.missingFields = init.missingFields ?? []
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/** Pt-BR text for the UI. Server `detail` is never shown verbatim: it may expose internals. */
export function describeApiError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Algo deu errado. Tente novamente.'
  switch (error.kind) {
    case 'network': return 'Não foi possível falar com o servidor. Verifique a conexão.'
    case 'timeout': return 'O servidor demorou demais para responder. Tente novamente.'
    case 'contract': return 'Recebemos uma resposta fora do contrato. Tente novamente ou avise o time.'
    case 'config': return error.message
    case 'session': return 'Sua sessão expirou. Entre novamente.'
    case 'http': break
  }
  switch (error.status) {
    case 400: return 'Revise os dados informados.'
    case 401: return 'Sua sessão expirou. Entre novamente.'
    case 403: return 'Sua conta não tem permissão para esta operação.'
    case 404: return 'Não encontramos o que você procurava.'
    case 409: return 'O estado mudou desde a última leitura. Atualize e tente de novo.'
    case 413: return 'O conteúdo enviado é grande demais.'
    case 422: return 'Faltam informações obrigatórias.'
    default: return error.status >= 500 ? 'O servidor está indisponível. Tente novamente mais tarde.' : `A API retornou HTTP ${error.status}.`
  }
}
