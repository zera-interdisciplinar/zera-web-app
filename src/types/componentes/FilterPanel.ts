import type { DashboardFilters, DashboardSnapshot } from '../dashboard'



export interface FilterPanelProps {
  filters: DashboardFilters
  available?: DashboardSnapshot['available_filters']
  problems: string[]
  onApply: (changes: Partial<DashboardFilters>) => void
  onClear: () => void
}
