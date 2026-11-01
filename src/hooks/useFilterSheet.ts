import { useState } from 'react'
import type { FilterSheetProps, FilterGroup } from '../types/componentes/FilterSheet'

export function useFilterSheet({ groups, onApply }: FilterSheetProps) {
  const [state, setState] = useState<{ open: boolean; draft: Record<string, string[]> }>({ open: false, draft: {} })
  const open = () => setState({ open: true, draft: Object.fromEntries(groups.map((group) => [group.id, group.selected])) })
  const close = () => setState((previous) => ({ ...previous, open: false }))
  const toggle = (group: FilterGroup, value: string) => setState((previous) => {
    const selected = previous.draft[group.id] ?? []
    const next = selected.includes(value) ? group.required ? selected : selected.filter((entry) => entry !== value) : group.multiple ? [...selected, value] : [value]
    return { ...previous, draft: { ...previous.draft, [group.id]: next } }
  })
  const reset = () => setState((previous) => ({ ...previous, draft: Object.fromEntries(groups.filter((group) => group.required).map((group) => [group.id, group.selected])) }))
  const apply = () => { onApply(state.draft); close() }
  return { state, open, close, toggle, reset, apply }
}
