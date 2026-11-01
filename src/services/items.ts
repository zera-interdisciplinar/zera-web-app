import type { ItemSelectionParams, CreateItemRequest, ItemEventPage, ItemPage, ItemResponse, ListItemsParams, UpdateItemRequest } from '../types/item'
import { toApiError } from '../utils/apiError'
import { eventPageSchema, itemPageSchema, itemSchema } from '../utils/itemSchemas'
import { http } from './http'

const path = (id: string, suffix = '') => `/api/v1/items/${encodeURIComponent(id)}${suffix}`

export async function listItems(params: ListItemsParams, signal?: AbortSignal): Promise<ItemPage> {
  try {
    return await http.request('inventory', '/api/v1/items', { query: { ...params }, schema: itemPageSchema, signal })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function getItem(id: string, signal?: AbortSignal): Promise<ItemResponse> {
  try {
    return await http.request('inventory', path(id), { schema: itemSchema, signal })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function listItemEvents(id: string, page: number, size: number, signal?: AbortSignal): Promise<ItemEventPage> {
  try {
    return await http.request('inventory', path(id, '/events'), { query: { page, size }, schema: eventPageSchema, signal })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createItem(body: CreateItemRequest): Promise<ItemResponse> {
  try {
    return await http.request('inventory', '/api/v1/items', { method: 'POST', body, schema: itemSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function submitItem(id: string): Promise<ItemResponse> {
  try {
    return await http.request('inventory', path(id, '/submit'), { method: 'POST', schema: itemSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function updateItem(id: string, body: UpdateItemRequest): Promise<ItemResponse> {
  try {
    return await http.request('inventory', path(id), { method: 'PATCH', body, schema: itemSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

/** Logical removal (BR-13): the item turns `REMOVED` and can be restored. */
export async function removeItem(id: string): Promise<void> {
  try {
    await http.request('inventory', path(id), { method: 'DELETE' })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function restoreItem(id: string): Promise<ItemResponse> {
  try {
    return await http.request('inventory', path(id, '/restore'), { method: 'POST', schema: itemSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function approveItem(id: string): Promise<ItemResponse> {
  try {
    return await http.request('inventory', path(id, '/approve'), { method: 'POST', schema: itemSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function rejectItem(id: string, reason: string): Promise<ItemResponse> {
  try {
    return await http.request('inventory', path(id, '/reject'), { method: 'POST', body: { reason }, schema: itemSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

/** OR within each group, AND between groups. Load every server page before intersecting categories. */
export async function listSelectedItems(params: ItemSelectionParams, signal?: AbortSignal): Promise<ItemPage> {
  try {
    const { statuses, categoryIds, ...base } = params
    if (statuses.length <= 1 && categoryIds.length <= 1) return await listItems({ ...base, status: statuses[0], categoryId: categoryIds[0] }, signal)
    const batches = await Promise.all((statuses.length ? statuses : [undefined]).map(async (status) => {
      const first = await listItems({ ...base, status, categoryId: categoryIds.length === 1 ? categoryIds[0] : undefined, page: 0, size: 100 }, signal)
      const rows = [...first.content]
      for (let page = 1; page < first.totalPages; page += 1) {
        signal?.throwIfAborted()
        const next = await listItems({ ...base, status, categoryId: categoryIds.length === 1 ? categoryIds[0] : undefined, page, size: 100 }, signal)
        rows.push(...next.content)
      }
      return rows
    }))
    const unique = new Map(batches.flat().filter((item) => !categoryIds.length || (item.model && categoryIds.includes(item.model.category.id))).map((item) => [item.id, item]))
    const rows = [...unique.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || (a.name ?? a.displayCode ?? a.barcode ?? a.id).localeCompare(b.name ?? b.displayCode ?? b.barcode ?? b.id, 'pt-BR', { numeric: true }) || a.id.localeCompare(b.id))
    const totalPages = Math.ceil(rows.length / base.size)
    const page = Math.min(base.page, Math.max(0, totalPages - 1))
    return { content: rows.slice(page * base.size, (page + 1) * base.size), page, size: base.size, totalElements: rows.length, totalPages }
  } catch (error) { throw toApiError(error) }
}
