import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { DEFAULT_PAGE_SIZE, parseItemSelection, toItemSelectionSearchParams } from '../utils/itemFilters'
import type { ItemSelectionParams } from '../types/item'

const SEARCH_DELAY_MS = 400

export function useItemFilters() {
  const [params, setParams] = useSearchParams()
  // Reparse only when the URL changes.
  const filters = useMemo(() => parseItemSelection(params), [params])
  const [search, setSearch] = useState(filters.q ?? '')

  // Any change but a page change goes back to the first page.
  const apply = useCallback((changes: Partial<ItemSelectionParams>) => {
    const next = { ...filters, ...changes }
    if (!('page' in changes)) next.page = 0
    for (const key of Object.keys(changes) as Array<keyof ItemSelectionParams>) if (changes[key] === undefined) delete next[key]
    setParams(toItemSelectionSearchParams(next), { replace: true })
  }, [filters, setParams])

  useEffect(() => {
    if (search.trim() === (filters.q ?? '')) return
    const timer = window.setTimeout(() => apply({ q: search.trim() || undefined }), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [search, filters.q, apply])

  // Resets the search text together with the URL.
  const clear = useCallback(() => { setSearch(''); setParams(new URLSearchParams(), { replace: true }) }, [setParams])
  const dirty = Boolean(filters.q || filters.statuses.length || filters.categoryIds.length || filters.modelId || filters.size !== DEFAULT_PAGE_SIZE)
  return { filters, search, setSearch, apply, clear, dirty }
}
