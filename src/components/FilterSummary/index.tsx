import { PERIOD_LABELS, statusLabel } from '../../utils/dashboardLabels'
import type { FilterSummaryProps } from '../../types/componentes/FilterSummary'

/** The "Período • Categoria • Situação • Responsável" line of the top bar (Figma WEB 01). */
export function FilterSummary({ filters, available }: FilterSummaryProps) {
  const responsible = filters.responsible ? (available?.responsibles.find((person) => person.id === filters.responsible)?.name ?? filters.responsible) : 'todos'
  const period = filters.from && filters.to ? `${filters.from} a ${filters.to}` : PERIOD_LABELS[filters.period]
  return (
    <p aria-label="Filtros aplicados">
      Período: {period} • Categoria: {filters.category ?? 'todas'} • Situação: {filters.status ? statusLabel(filters.status) : 'todas'} • Responsável: {responsible}
    </p>
  )
}
