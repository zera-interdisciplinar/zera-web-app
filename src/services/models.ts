import type { ItemPage, Model, MaterialCode, ModelPage } from '../types/item'
import type { CreateModelRequest, ListModelsParams } from '../types/model'
import { toApiError } from '../utils/apiError'
import { itemPageSchema, modelPageSchema, modelSchema } from '../utils/itemSchemas'
import { http } from './http'

const path = (id: string, suffix = '') => `/api/v1/models/${encodeURIComponent(id)}${suffix}`

async function patchModel(url: string, body: unknown): Promise<Model> {
  try {
    return await http.request('inventory', url, { method: 'PATCH', body, schema: modelSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function listModels(params: ListModelsParams, signal?: AbortSignal): Promise<ModelPage> {
  try {
    return await http.request('inventory', '/api/v1/models', { query: { ...params }, schema: modelPageSchema, signal })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function listModelItems(id: string, page: number, size: number, signal?: AbortSignal): Promise<ItemPage> {
  try {
    return await http.request('inventory', path(id, '/items'), { query: { page, size }, schema: itemPageSchema, signal })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function createModel(body: CreateModelRequest): Promise<Model> {
  try {
    return await http.request('inventory', '/api/v1/models', { method: 'POST', body, schema: modelSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

/** 409 when an item still uses the model (BR-17). */
export async function removeModel(id: string): Promise<void> {
  try {
    await http.request('inventory', path(id), { method: 'DELETE' })
  } catch (error) {
    throw toApiError(error)
  }
}

export const renameModel = (id: string, name: string): Promise<Model> => patchModel(path(id, '/name'), { name })
export const setModelManufacturer = (id: string, manufacturer: string): Promise<Model> => patchModel(path(id, '/manufacturer'), { manufacturer })
export const setModelWarranty = (id: string, warrantyMonths: number): Promise<Model> => patchModel(path(id, '/warranty-months'), { warrantyMonths })
export const setModelLifespan = (id: string, expectedLifespanMonths: number): Promise<Model> => patchModel(path(id, '/expected-lifespan-months'), { expectedLifespanMonths })
export const setModelMaterials = (id: string, materials: MaterialCode[]): Promise<Model> => patchModel(path(id, '/materials'), { materials })
