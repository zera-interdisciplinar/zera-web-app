import { ITEM_STATUSES, type ItemStatus } from '../schemas/item'
import type { ListItemsParams } from '../api/itemsApi'

export const PAGE_SIZES = [20, 50, 100]
export const DEFAULT_PAGE_SIZE = 20

/** The list filters live in the URL, so a filtered view can be bookmarked and survives F5 and the back button. */
export function parseItemFilters(params: URLSearchParams): ListItemsParams {
  const status = params.get('status')
  const size = Number(params.get('size'))
  const page = Number(params.get('page'))
  const filters: ListItemsParams = {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE_SIZE,
  }
  const q = params.get('q')?.trim()
  if (q) filters.q = q.slice(0, 60)
  if (status && (ITEM_STATUSES as readonly string[]).includes(status)) filters.status = status as ItemStatus
  const categoryId = params.get('categoryId')
  if (categoryId) filters.categoryId = categoryId
  const modelId = params.get('modelId')
  if (modelId) filters.modelId = modelId
  return filters
}

export function toItemSearchParams(filters: ListItemsParams): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.status) params.set('status', filters.status)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.modelId) params.set('modelId', filters.modelId)
  if (filters.page > 0) params.set('page', String(filters.page))
  if (filters.size !== DEFAULT_PAGE_SIZE) params.set('size', String(filters.size))
  return params
}
