export type TipoManutencao = 'preventiva' | 'corretiva'
export type RiscoFalha = 'baixo' | 'medio' | 'alto'

export interface Manutencao {
  id: number
  produtoId: number | string
  data: string
  tipo: TipoManutencao
  descricao: string
  tecnico: string
}

export interface NovaManutencao {
  produtoId: number | string
  tipo: TipoManutencao
  descricao: string
  tecnico: string
}

export interface FatorAnalise {
  rotulo: string
  detalhe: string
  pontos: number
}

export interface AnalisePreventiva {
  produtoId: number | string
  risco: RiscoFalha
  pontuacao: number
  fatores: FatorAnalise[]
  recomendacao: string
}
