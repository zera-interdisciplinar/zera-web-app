import type { DashboardSnapshot, FiltrosDashboard } from '../dashboardAnalytics';

export interface QualidadeDadosTabProps { demo?: boolean; filtros?: FiltrosDashboard; snapshot?: DashboardSnapshot | null; aguardando?: boolean }
