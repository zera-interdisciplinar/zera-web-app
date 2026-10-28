
export interface EstadoRequisicao<T> {
  dados: T | null
  carregando: boolean
  erro: string | null
  recarregar: () => void
}
export interface IdentificadorRequisicao<T> {
  buscar: (sinal: AbortSignal) => Promise<T>
  ativo: boolean
  gatilho: number
}

export interface EstadoLocalRequisicao<T> {
  resultado: {
    dados: T | null
    erro: string | null
    requisicao: IdentificadorRequisicao<T> | null
  }
  gatilho: number
}
