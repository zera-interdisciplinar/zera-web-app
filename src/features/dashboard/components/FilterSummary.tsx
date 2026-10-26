import type { DashboardFilters } from '../model/filters'
import { PERIOD_LABELS, statusLabel } from '../model/labels'
import type { DashboardSnapshot } from '../schemas/snapshot'

/** The "Período • Categoria • Situação • Responsável" line of the top bar (Figma WEB 01). */
export function FilterSummary({ filters, available }: { filters: DashboardFilters; available?: DashboardSnapshot['available_filters'] }) {
  const responsible = filters.responsible ? (available?.responsibles.find((person) => person.id === filters.responsible)?.name ?? filters.responsible) : 'todos'
  const period = filters.from && filters.to ? `${filters.from} a ${filters.to}` : PERIOD_LABELS[filters.period]
  return (
    <p aria-label="Filtros aplicados">
      Período: {period} • Categoria: {filters.category ?? 'todas'} • Situação: {filters.status ? statusLabel(filters.status) : 'todas'} • Responsável: {responsible}
    </p>
  )
}
