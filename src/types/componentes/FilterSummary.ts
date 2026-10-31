import type { DashboardFilters, DashboardSnapshot } from '../dashboard'



export interface FilterSummaryProps { filters: DashboardFilters; available?: DashboardSnapshot['available_filters'] }
