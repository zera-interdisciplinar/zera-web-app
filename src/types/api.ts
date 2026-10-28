
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
  if (erro instanceof Error && (/BFF|contrato|endpoint|payload|analytics|HTTP|API|Paginação|JSON/i.test(erro.message)
    || (erro instanceof ApiError && (erro.tipoFalha || erro.status >= 500)))) {
    if (import.meta.env.DEV && erro instanceof ApiError) console.warn('[Zera] Falha de consulta', { status: erro.status, tipo: erro.tipoFalha ?? 'resposta' })
    return 'Não conseguimos carregar agora. Tente de novo em instantes.'
  }
  if (erro instanceof ApiError) return erro.message
  if (erro instanceof Error) return erro.message
  return 'Falha inesperada ao falar com o servidor.'
}
