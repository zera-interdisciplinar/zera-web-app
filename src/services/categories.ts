import { z } from 'zod'
import type { Category } from '../types/item'
import { toApiError } from '../utils/apiError'
import { categorySchema } from '../utils/itemSchemas'
import { http } from './http'

const path = (id: string, suffix = '') => `/api/v1/categories/${encodeURIComponent(id)}${suffix}`

/** A small array by contract (no pagination, BR-15). */
export async function listCategories(signal?: AbortSignal): Promise<Category[]> {
  try {
    return await http.request('inventory', '/api/v1/categories', { schema: z.array(categorySchema), signal })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createCategory(body: { name: string; description: string }): Promise<Category> {
  try {
    return await http.request('inventory', '/api/v1/categories', { method: 'POST', body, schema: categorySchema })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function renameCategory(id: string, name: string): Promise<Category> {
  try {
    return await http.request('inventory', path(id, '/name'), { method: 'PATCH', body: { name }, schema: categorySchema })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function setCategoryDescription(id: string, description: string): Promise<Category> {
  try {
    return await http.request('inventory', path(id, '/description'), { method: 'PATCH', body: { description }, schema: categorySchema })
  } catch (error) {
    throw toApiError(error)
  }
}

/** 409 when a model still uses the category (BR-16). */
export async function removeCategory(id: string): Promise<void> {
  try {
    await http.request('inventory', path(id), { method: 'DELETE' })
  } catch (error) {
    throw toApiError(error)
  }
}
