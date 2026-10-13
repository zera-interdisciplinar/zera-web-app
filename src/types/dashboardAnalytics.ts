export type PeriodoDashboard = '30d' | '6m' | '12m'
export type VisaoDashboard = 'todos' | 'pendentes' | 'categoria'

export interface FiltrosDashboard {
  period: PeriodoDashboard
  from?: string
  to?: string
  category?: string
  status?: string
  unitId?: string
  responsible?: string
  q?: string
  view: VisaoDashboard
  condition?: string
  registrationMonth?: string
  recyclable?: string
  hazardous?: string
}

export interface MedidaComVariacao {
  value: number
  change_percent: number | null
}

export interface PercentualComVariacao {
  percent: number | null
  change_points: number | null
}

export interface DashboardSnapshot {
  batch_id: string
  extracted_at: string
  organization: { id: string; name: string }
  applied_filters: {
    period: PeriodoDashboard
    date_from: string | null
    date_to: string | null
    category: string | null
    status: string | null
    unit_id: string | null
    responsible: string | null
    query: string | null
    view: VisaoDashboard
  }
  available_filters: {
    categories: string[]
    statuses: string[]
    units: Array<{ id: string; name: string }>
    responsibles: Array<{ id: string; name: string }>
    views: VisaoDashboard[]
    periods: PeriodoDashboard[]
  }
  kpis: {
    itens_cadastrados: MedidaComVariacao
    taxa_reciclagem: PercentualComVariacao
    aguardando_aprovacao: { value: number; prioritarios: number }
    impacto_recuperado: { kg: number; tonnes: number }
  }
  itens_por_mes: Array<{ mes: string; cadastrados: number; encaminhados: number }>
  circularidade: { percent: number | null }
  por_categoria: Array<{ nome: string; quantidade: number; percentual: number | null }>
  por_status: Array<{ nome: string; quantidade: number; percentual: number | null }>
  alertas: { abertos: number; por_gravidade: Array<{ gravidade: string; quantidade: number }> }
}

export type EventoSseDashboard =
  | { event: 'snapshot'; data: DashboardSnapshot }
  | { event: 'unavailable'; data: { detail: string } }
  | { event: 'error'; data: { status: number; detail: string } }

export interface PontoDashboardMock {
  name: string
  value: number
  group?: string
}

export interface DashboardMockVisaoGeral {
  eventosRegistrados: number
  modelosCadastrados: number
  danosInformados: number
  eventosPorItem: number
  materiaisClassificados: number
  itensPorCondicao: PontoDashboardMock[]
  itensPorFabricante: PontoDashboardMock[]
  itensPorModelo: PontoDashboardMock[]
}
