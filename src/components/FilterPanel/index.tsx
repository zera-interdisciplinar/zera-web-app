import { useDashboardRange } from '../../hooks/useDashboardRange'
import { useId } from 'react'
import { PERIODS } from '../../utils/snapshotValidation'
import { PERIOD_LABELS, statusLabel } from '../../utils/dashboardLabels'
import { FilterSheet } from '../FilterSheet'
import styles from '../../../styles/components/Dashboard/Dashboard.module.css'
import type { FilterPanelProps } from '../../types/componentes/FilterPanel'
import type { DashboardFilters } from '../../types/dashboard'

export function FilterPanel(props: FilterPanelProps) {
  const { filters, available, problems, onApply, onClear } = props
  const id = useId()
  const { range, dispatch, applyRange } = useDashboardRange(props)
  return (
    <div className={styles.filterLayout}>
      <FilterSheet title="Filtrar visão geral" groups={[
        { id: 'period', label: 'Período', required: true, selected: [filters.period], options: PERIODS.map((period) => ({ value: period, label: PERIOD_LABELS[period] })) },
        { id: 'category', label: 'Categoria', selected: filters.category ? [filters.category] : [], options: (available?.categories ?? []).map((value) => ({ value, label: value })) },
        { id: 'status', label: 'Situação', selected: filters.status ? [filters.status] : [], options: (available?.statuses ?? []).map((value) => ({ value, label: statusLabel(value) })) },
        { id: 'responsible', label: 'Responsável', selected: filters.responsible ? [filters.responsible] : [], options: (available?.responsibles ?? []).map((person) => ({ value: person.id, label: person.name })) },
      ]} onApply={(selection) => onApply({
        ...(selection.period?.[0] !== filters.period ? { period: (selection.period?.[0] ?? '6m') as DashboardFilters['period'] } : {}),
        category: selection.category?.[0], status: selection.status?.[0], responsible: selection.responsible?.[0],
      })} onClear={onClear} />
      <details className={styles.filtersBox} open={problems.length > 0 || undefined}>
        <summary>Intervalo personalizado{filters.from && filters.to ? `: ${filters.from} a ${filters.to}` : ''}</summary>
        <fieldset className={`${styles.range} ${styles.datePanel}`}>
          <legend>Intervalo de datas</legend>
          <div className={styles.field}><label htmlFor={`${id}-from`}>De</label><input id={`${id}-from`} type="date" value={range.from} onChange={(event) => dispatch({ type: 'from', value: event.target.value })} /></div>
          <div className={styles.field}><label htmlFor={`${id}-to`}>Até</label><input id={`${id}-to`} type="date" value={range.to} onChange={(event) => dispatch({ type: 'to', value: event.target.value })} /></div>
          <button type="button" onClick={applyRange}>Aplicar intervalo</button>
          {[range.error, ...problems].filter((message): message is string => Boolean(message)).map((message) => <p key={message} role="alert" className={styles.fieldError}>{message}</p>)}
        </fieldset>
      </details>
    </div>
  )
}
