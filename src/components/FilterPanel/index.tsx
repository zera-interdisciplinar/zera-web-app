import { useId, useReducer } from 'react'
import { PERIODS } from '../../utils/snapshotValidation'

import { PERIOD_LABELS, statusLabel } from '../../utils/dashboardLabels'
import styles from '../../../styles/components/Dashboard/Dashboard.module.css'
import type { FilterPanelProps } from '../../types/componentes/FilterPanel'
import type { DashboardFilters } from '../../types/dashboard'

interface RangeState { from: string; to: string; error: string | null }
type RangeAction = { type: 'from' | 'to'; value: string } | { type: 'error'; message: string | null }

function rangeReducer(state: RangeState, action: RangeAction): RangeState {
  return action.type === 'error' ? { ...state, error: action.message } : { ...state, [action.type]: action.value, error: null }
}

export function FilterPanel({ filters, available, problems, onApply, onClear }: FilterPanelProps) {
  const id = useId()
  const [range, dispatch] = useReducer(rangeReducer, { from: filters.from ?? '', to: filters.to ?? '', error: null })

  function applyRange() {
    if (!range.from || !range.to) return dispatch({ type: 'error', message: 'Informe as duas datas do intervalo (de e até).' })
    if (range.from > range.to) return dispatch({ type: 'error', message: 'A data inicial não pode ser depois da final.' })
    onApply({ from: range.from, to: range.to })
  }

  const select = (key: 'category' | 'status' | 'responsible', label: string, options: Array<{ value: string; label: string }>) => (
    <div className={styles.field}>
      <label htmlFor={`${id}-${key}`}>{label}</label>
      <select id={`${id}-${key}`} value={filters[key] ?? ''} onChange={(event) => onApply({ [key]: event.target.value || undefined })}>
        <option value="">Todos</option>
        {filters[key] && !options.some((option) => option.value === filters[key]) && <option value={filters[key]}>{filters[key]}</option>}
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  )

  return (
    <details className={styles.filtersBox} open={problems.length > 0 || undefined}>
      <summary>Filtros</summary>
      <section className={styles.filters} aria-label="Filtros do dashboard">
      <div className={styles.field}>
        <label htmlFor={`${id}-period`}>Período</label>
        <select id={`${id}-period`} value={filters.from ? '' : filters.period} onChange={(event) => onApply({ period: event.target.value as DashboardFilters['period'] })}>
          {filters.from && <option value="">Intervalo personalizado</option>}
          {PERIODS.map((period) => <option key={period} value={period}>{PERIOD_LABELS[period]}</option>)}
        </select>
      </div>
      {select('category', 'Categoria', (available?.categories ?? []).map((value) => ({ value, label: value })))}
      {select('status', 'Situação', (available?.statuses ?? []).map((value) => ({ value, label: statusLabel(value) })))}
      {select('responsible', 'Responsável', (available?.responsibles ?? []).map((person) => ({ value: person.id, label: person.name })))}
      <fieldset className={styles.range}>
        <legend>Intervalo de datas</legend>
        <div className={styles.field}><label htmlFor={`${id}-from`}>De</label><input id={`${id}-from`} type="date" value={range.from} onChange={(event) => dispatch({ type: 'from', value: event.target.value })} /></div>
        <div className={styles.field}><label htmlFor={`${id}-to`}>Até</label><input id={`${id}-to`} type="date" value={range.to} onChange={(event) => dispatch({ type: 'to', value: event.target.value })} /></div>
        <button type="button" onClick={applyRange}>Aplicar</button>
        {[range.error, ...problems].filter((message): message is string => Boolean(message)).map((message) => <p key={message} role="alert" className={styles.fieldError}>{message}</p>)}
      </fieldset>
      <button type="button" className={styles.clear} onClick={onClear}>Limpar filtros</button>
      </section>
    </details>
  )
}
