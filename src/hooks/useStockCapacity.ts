import { useItemsList } from './useItemQueries'

/** Count only items in stock; drafts and pending items do not occupy stock capacity. */
export function useStockCapacity(capacity: number | null) {
  const items = useItemsList({ page: 0, size: 1, status: 'IN_STOCK' })
  const count = items.data?.totalElements ?? null
  const percent = count !== null && capacity !== null && capacity > 0 ? Math.round(count / capacity * 100) : null
  const free = count !== null && capacity !== null ? Math.max(0, capacity - count) : null
  return { count, percent, free, pending: items.isPending, error: items.isError }
}
