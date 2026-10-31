import { z } from 'zod'
import type { Material } from '../types/item'
import { toApiError } from '../utils/apiError'
import { materialSchema } from '../utils/itemSchemas'
import { http } from './http'

/** Materials are global, so this call does not send the unit. */
export async function listMaterials(signal?: AbortSignal): Promise<Material[]> {
  try {
    return await http.request('inventory', '/api/v1/materials', { unit: false, schema: z.array(materialSchema), signal })
  } catch (error) {
    throw toApiError(error)
  }
}
