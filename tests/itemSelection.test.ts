import { beforeEach, expect, it, vi } from 'vitest'
import type { ItemResponse, ItemSelectionParams } from '../src/types/item'
import { parseItemSelection, toItemSelectionSearchParams } from '../src/utils/itemFilters'

const request = vi.hoisted(() => vi.fn())
vi.mock('../src/services/http', () => ({ http: { request } }))
import { listSelectedItems } from '../src/services/items'

const filters: ItemSelectionParams = { page: 0, size: 20, statuses: ['IN_STOCK', 'IN_USE'], categoryIds: ['a', 'b'] }
const item = (id: string, status: string, category: string): ItemResponse => ({ id, status, updatedAt: '2026-11-01T12:00:00Z', model: { category: { id: category } } } as ItemResponse)
let rows: ItemResponse[]
beforeEach(() => {
  rows = Array.from({ length: 155 }, (_, index) => item(`stock-${String(index).padStart(3, '0')}`, 'IN_STOCK', index < 120 ? 'a' : 'c')).concat(item('use', 'IN_USE', 'b'), item('removed', 'REMOVED', 'a'))
  request.mockReset()
  request.mockImplementation(async (_service, _path, options) => {
    options.signal?.throwIfAborted()
    const q = options.query
    const matching = rows.filter((row) => q.status ? row.status === q.status : row.status !== 'REMOVED').filter((row) => !q.categoryId || row.model?.category.id === q.categoryId)
    return { content: matching.slice(q.page * q.size, (q.page + 1) * q.size), page: q.page, size: q.size, totalElements: matching.length, totalPages: Math.ceil(matching.length / q.size) }
  })
})
it('intersects category OR status OR after reading every server page, then paginates the complete result', async () => {
  const result = await listSelectedItems(filters)
  expect(result.totalElements).toBe(121)
  expect(result.totalPages).toBe(7)
  expect(result.content).toHaveLength(20)
  expect(request.mock.calls.some((call) => call[2].query.page === 1)).toBe(true)
  const last = await listSelectedItems({ ...filters, page: 6 })
  expect(last.content).toHaveLength(1)
})
it('keeps removed items when explicitly selected with another status', async () => {
  const result = await listSelectedItems({ ...filters, statuses: ['REMOVED', 'IN_USE'] })
  expect(result.content.map((row) => row.id).sort()).toEqual(['removed', 'use'])
})
it('delegates a single selection to the paginated API without downloading every page', async () => {
  const result = await listSelectedItems({ ...filters, page: 2, statuses: ['IN_STOCK'], categoryIds: ['a'] })
  expect(request).toHaveBeenCalledTimes(1)
  expect(result.page).toBe(2)
})
it('rejects cancellation and failed requests instead of showing partial totals', async () => {
  const controller = new AbortController(); controller.abort()
  await expect(listSelectedItems(filters, controller.signal)).rejects.toThrow()
  request.mockRejectedValueOnce(new Error('offline'))
  await expect(listSelectedItems(filters)).rejects.toThrow()
})
it('round-trips repeated filter URL values and removes invalid statuses and duplicates', () => {
  const parsed = parseItemSelection(new URLSearchParams('status=IN_STOCK&status=IN_USE&status=INVALID&status=IN_USE&categoryId=a&categoryId=b'))
  expect(parsed.statuses).toEqual(['IN_STOCK', 'IN_USE'])
  expect(parsed.categoryIds).toEqual(['a', 'b'])
  expect(parseItemSelection(toItemSelectionSearchParams(parsed))).toEqual(parsed)
})
