import type { CreateItemRequest, ItemEventPage, ItemPage, ItemResponse, ListItemsParams, UpdateItemRequest } from '../types/item'
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
