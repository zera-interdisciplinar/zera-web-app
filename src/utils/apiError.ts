import type { ApiErrorKind, ApiErrorInit } from '../types/http'


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

/**
 * What a service throws: an `ApiError` or an abort stay as they are, anything else (a bug in a client layer, a
 * non-Error value) is wrapped so callers can always rely on `describeApiError`.
 */
export function toApiError(error: unknown): ApiError | DOMException {
  if (error instanceof ApiError || (error instanceof DOMException && error.name === 'AbortError')) return error
  return new ApiError('Não foi possível concluir a operação.', { kind: 'network', cause: error })
}
