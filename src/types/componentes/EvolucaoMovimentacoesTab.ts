import type { DashboardSnapshot, FiltrosDashboard } from '../dashboardAnalytics';

export interface EvolucaoMovimentacoesTabProps { filtros?: FiltrosDashboard; snapshot?: DashboardSnapshot | null; aguardando?: boolean }
