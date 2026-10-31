import { useCallback } from 'react'
import { listModelItems } from '../services/models'
import type { ItemPage } from '../types/item'
import type { RequestState } from '../types/request'
import { useRequest } from './useRequest'

export const MODEL_ITEMS_PAGE_SIZE = 20

/** The items that use a model, one server page at a time. */
export function useModelItems(modelId: string, page: number): RequestState<ItemPage> {
  // A new model or page produces a new fetcher, which aborts the previous request and starts another.
  const fetcher = useCallback((signal: AbortSignal) => listModelItems(modelId, page, MODEL_ITEMS_PAGE_SIZE, signal), [modelId, page])
  return useRequest(fetcher)
}
