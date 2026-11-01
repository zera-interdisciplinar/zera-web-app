import { useReducer } from 'react'
import type { FilterPanelProps } from '../types/componentes/FilterPanel'

interface RangeState { from: string; to: string; error: string | null }
type RangeAction = { type: 'from' | 'to'; value: string } | { type: 'error'; message: string | null }

function rangeReducer(state: RangeState, action: RangeAction): RangeState {
  return action.type === 'error' ? { ...state, error: action.message } : { ...state, [action.type]: action.value, error: null }
}

export function useDashboardRange({ filters, onApply }: FilterPanelProps) {
  const [range, dispatch] = useReducer(rangeReducer, { from: filters.from ?? '', to: filters.to ?? '', error: null })

  function applyRange() {
    if (!range.from || !range.to) return dispatch({ type: 'error', message: 'Informe as duas datas do intervalo (de e até).' })
    if (range.from > range.to) return dispatch({ type: 'error', message: 'A data inicial não pode ser depois da final.' })
    onApply({ from: range.from, to: range.to })
  }

  return { range, dispatch, applyRange }
}
