import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { parseFilters, toSearchParams } from '../utils/dashboardFilters'
import type { DashboardFilters } from '../types/dashboard'

/** The filters live in the URL, so a view can be bookmarked, shared and restored with the back button. */
export function useDashboardFilters() {
  const [params, setParams] = useSearchParams()
  // Reparse the URL only when it changes, so the stream is not restarted by unrelated renders.
  const { filters, problems } = useMemo(() => parseFilters(params), [params])

  // Changes identity only when the URL changes, which is also when the debounced search must re-evaluate.
  const apply = useCallback((changes: Partial<DashboardFilters>) => {
    const next: DashboardFilters = { ...filters, ...changes }
    // Picking a preset period clears a custom range.
    if ('period' in changes) { delete next.from; delete next.to }
    for (const key of Object.keys(changes) as Array<keyof DashboardFilters>) if (changes[key] === undefined) delete next[key]
    setParams(toSearchParams(next), { replace: true })
  }, [filters, setParams])

  // Clears every filter, search included.
  const clear = useCallback(() => setParams(new URLSearchParams(), { replace: true }), [setParams])

  return { filters, problems, apply, clear }
}
