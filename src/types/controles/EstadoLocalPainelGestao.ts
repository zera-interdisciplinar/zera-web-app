import type { FiltrosDashboard } from '../dashboardAnalytics';

export type AbaId = 'operational' | 'overview' | 'life' | 'evolution' | 'quality' | 'materials'
export type FiltroKey = keyof FiltrosDashboard
export interface OpcaoFiltro { value: string; label: string }
export interface DefinicaoFiltro { key: FiltroKey; label: string; options: OpcaoFiltro[] }

export interface EstadoLocalPainelGestao {
  aba: AbaId
  filtros: FiltrosDashboard
}
