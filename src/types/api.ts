
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

export type TipoFalhaApi = 'rede' | 'configuracao' | 'resposta'

export class ApiError extends Error {
  readonly status: number
  readonly campo?: string
  readonly tipoFalha?: TipoFalhaApi

  constructor(mensagem: string, status: number, campo?: string, tipoFalha?: TipoFalhaApi) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.campo = campo
    this.tipoFalha = tipoFalha
  }
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ApiError) return erro.message
  if (erro instanceof Error) return erro.message
  return 'Falha inesperada ao falar com o servidor.'
}
