import { z } from 'zod'
import { http } from '../../../shared/api/http'
import { categorySchema, itemPageSchema, modelPageSchema, modelSchema, type MaterialCode } from '../../items/schemas/item'
import type { ApprovalStatus } from '../model/labels'

export interface ListModelsParams {
  page: number
  size: number
  approvalStatus?: ApprovalStatus
}

export interface CreateModelRequest {
  name: string
  manufacturer: string
  categoryId: string
  materials: MaterialCode[]
  estimatedWeightKg?: number
  warrantyMonths?: number
  expectedLifespanMonths?: number
  notes?: string
}

const path = (id: string, suffix = '') => `/api/v1/models/${encodeURIComponent(id)}${suffix}`
const categoryPath = (id: string, suffix = '') => `/api/v1/categories/${encodeURIComponent(id)}${suffix}`
const patch = (url: string, body: unknown) => http.request('inventory', url, { method: 'PATCH', body, schema: modelSchema })

export const modelsApi = {
  list: (params: ListModelsParams, signal?: AbortSignal) => http.request('inventory', '/api/v1/models', { query: { ...params }, schema: modelPageSchema, signal }),
  items: (id: string, page: number, size: number, signal?: AbortSignal) => http.request('inventory', path(id, '/items'), { query: { page, size }, schema: itemPageSchema, signal }),
  create: (body: CreateModelRequest) => http.request('inventory', '/api/v1/models', { method: 'POST', body, schema: modelSchema }),
  remove: (id: string) => http.request('inventory', path(id), { method: 'DELETE' }),
  rename: (id: string, name: string) => patch(path(id, '/name'), { name }),
  setManufacturer: (id: string, manufacturer: string) => patch(path(id, '/manufacturer'), { manufacturer }),
  setWarranty: (id: string, warrantyMonths: number) => patch(path(id, '/warranty-months'), { warrantyMonths }),
  setLifespan: (id: string, expectedLifespanMonths: number) => patch(path(id, '/expected-lifespan-months'), { expectedLifespanMonths }),
  setMaterials: (id: string, materials: MaterialCode[]) => patch(path(id, '/materials'), { materials }),
}

export const categoriesApi = {
  list: (signal?: AbortSignal) => http.request('inventory', '/api/v1/categories', { schema: z.array(categorySchema), signal }),
  create: (body: { name: string; description: string }) => http.request('inventory', '/api/v1/categories', { method: 'POST', body, schema: categorySchema }),
  rename: (id: string, name: string) => http.request('inventory', categoryPath(id, '/name'), { method: 'PATCH', body: { name }, schema: categorySchema }),
  setDescription: (id: string, description: string) => http.request('inventory', categoryPath(id, '/description'), { method: 'PATCH', body: { description }, schema: categorySchema }),
  remove: (id: string) => http.request('inventory', categoryPath(id), { method: 'DELETE' }),
}
