import type { DashboardSnapshot, FiltrosDashboard } from '../dashboardAnalytics';

export interface EvolucaoMovimentacoesTabProps { demo?: boolean; filtros?: FiltrosDashboard; snapshot?: DashboardSnapshot | null; aguardando?: boolean }
