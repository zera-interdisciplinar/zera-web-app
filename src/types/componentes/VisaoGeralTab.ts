import type { DashboardSnapshot } from '../dashboardAnalytics';

export interface VisaoGeralTabProps { snapshot: DashboardSnapshot | null; demo?: boolean; aguardando?: boolean }

export interface KpiDashboardProps { titulo: string; valor: string; nota?: string; demo?: boolean }
