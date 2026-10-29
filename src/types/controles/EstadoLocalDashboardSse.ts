import type { EstadoConexaoDashboard, FalhaDashboard } from '../../services/dashboardSse';
import type { DashboardSnapshot } from '../dashboardAnalytics';

export type EstadoPorFiltro<T> = { chave: string; valor: T }

export interface EstadoLocalDashboardSse {
  tentativa: number
  snapshotAtual: EstadoPorFiltro<DashboardSnapshot> | null
  estadoAtual: EstadoPorFiltro<EstadoConexaoDashboard> | null
  indisponivelAtual: EstadoPorFiltro<string> | null
  erroAtual: EstadoPorFiltro<FalhaDashboard> | null
}
