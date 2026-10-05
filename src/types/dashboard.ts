export interface Kpis {
  itensCadastrados: number
  deltaItens: string
  taxaReciclagem: number
  deltaReciclagem: string
  aguardandoAprovacao: number
  prioritarios: number
  impactoToneladas: number
}

export interface PontoMensal {
  mes: string
  total: number
  atual: boolean
}

export interface Circularidade {
  percentual: number
  meta: number
}

export interface ResumoDashboard {
  kpis: Kpis
  serie: PontoMensal[]
  circularidade: Circularidade
  origem?: 'api' | 'demo'
}
