
export interface Paginacao<T> {
  conteudo: T[]
  pagina: number
  tamanhoPagina: number
  total: number
}

export interface ApiErroCorpo {
  mensagem: string
  campo?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly campo?: string

  constructor(mensagem: string, status: number, campo?: string) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.campo = campo
  }
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ApiError) return erro.message
  if (erro instanceof Error) return erro.message
  return 'Falha inesperada ao falar com o servidor.'
}
