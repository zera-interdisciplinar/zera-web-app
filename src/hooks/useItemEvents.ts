import { useCallback } from 'react'
import { listItemEvents } from '../services/items'
import type { ItemEventPage } from '../types/item'
import type { RequestState } from '../types/request'
import { useRequest } from './useRequest'

export const EVENTS_PAGE_SIZE = 20

/** The history of one item. `version` (the item's last update) makes it reload when the item changes. */
export function useItemEvents(itemId: string, page: number, version: string): RequestState<ItemEventPage> {
  // A new item or page produces a new fetcher, which aborts the previous request and starts another.
  const fetcher = useCallback((signal: AbortSignal) => listItemEvents(itemId, page, EVENTS_PAGE_SIZE, signal), [itemId, page])
  return useRequest(fetcher, true, version)
}
