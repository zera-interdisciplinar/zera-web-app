import { z } from 'zod'
import { http } from '../../../shared/api/http'
import type { CreateItemRequest, UpdateItemRequest } from '../model/requests'
import { categorySchema, eventPageSchema, itemPageSchema, itemSchema, materialSchema, modelPageSchema, type ItemStatus } from '../schemas/item'

export interface ListItemsParams {
  page: number
  size: number
  q?: string
  status?: ItemStatus
  categoryId?: string
  modelId?: string
}

const path = (id: string) => `/api/v1/items/${encodeURIComponent(id)}`

export const itemsApi = {
  list: (params: ListItemsParams, signal?: AbortSignal) =>
    http.request('inventory', '/api/v1/items', { query: { ...params }, schema: itemPageSchema, signal }),
  get: (id: string, signal?: AbortSignal) => http.request('inventory', path(id), { schema: itemSchema, signal }),
  events: (id: string, page: number, size: number, signal?: AbortSignal) =>
    http.request('inventory', `${path(id)}/events`, { query: { page, size }, schema: eventPageSchema, signal }),
  create: (body: CreateItemRequest) => http.request('inventory', '/api/v1/items', { method: 'POST', body, schema: itemSchema }),
  submit: (id: string) => http.request('inventory', `${path(id)}/submit`, { method: 'POST', schema: itemSchema }),
  update: (id: string, body: UpdateItemRequest) => http.request('inventory', path(id), { method: 'PATCH', body, schema: itemSchema }),
  remove: (id: string) => http.request('inventory', path(id), { method: 'DELETE' }),
  restore: (id: string) => http.request('inventory', `${path(id)}/restore`, { method: 'POST', schema: itemSchema }),
  approve: (id: string) => http.request('inventory', `${path(id)}/approve`, { method: 'POST', schema: itemSchema }),
  reject: (id: string, reason: string) => http.request('inventory', `${path(id)}/reject`, { method: 'POST', body: { reason }, schema: itemSchema }),
}

/** Catalogs used by the item screens. Categories and materials are small arrays by contract. */
export const catalogApi = {
  categories: (signal?: AbortSignal) => http.request('inventory', '/api/v1/categories', { schema: z.array(categorySchema), signal }),
  materials: (signal?: AbortSignal) => http.request('inventory', '/api/v1/materials', { unit: false, schema: z.array(materialSchema), signal }),
  /** First page of models for the selector; the models screen has its own pagination. */
  models: (size: number, signal?: AbortSignal) => http.request('inventory', '/api/v1/models', { query: { page: 0, size }, schema: modelPageSchema, signal }),
}
