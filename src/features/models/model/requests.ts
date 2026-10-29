import type { CreateModelRequest } from '../api/modelsApi'
import type { ModelFormValues } from '../schemas/forms'
import type { Model } from '../../items/schemas/item'

export function toCreateModelRequest(values: ModelFormValues): CreateModelRequest {
  const request: CreateModelRequest = { name: values.name, manufacturer: values.manufacturer, categoryId: values.categoryId, materials: values.materials }
  if (values.estimatedWeightKg !== undefined) request.estimatedWeightKg = values.estimatedWeightKg
  if (values.warrantyMonths !== undefined) request.warrantyMonths = values.warrantyMonths
  if (values.expectedLifespanMonths !== undefined) request.expectedLifespanMonths = values.expectedLifespanMonths
  if (values.notes) request.notes = values.notes
  return request
}

export type ModelPatch =
  | { field: 'name'; value: string }
  | { field: 'manufacturer'; value: string }
  | { field: 'warrantyMonths'; value: number }
  | { field: 'expectedLifespanMonths'; value: number }
  | { field: 'materials'; value: ModelFormValues['materials'] }

const sameSet = (a: readonly string[], b: readonly string[]) => a.length === b.length && [...a].sort().every((value, index) => value === [...b].sort()[index])

/**
 * Each model attribute has its own PATCH, so an edit becomes one call per changed field (BR-17).
 * Warranty and lifespan cannot be erased through this API: an emptied input means "leave as is".
 */
export function toModelPatches(model: Pick<Model, 'name' | 'manufacturer' | 'warrantyMonths' | 'expectedLifespanMonths' | 'materials'>, next: Pick<ModelFormValues, 'name' | 'manufacturer' | 'warrantyMonths' | 'expectedLifespanMonths' | 'materials'>): ModelPatch[] {
  const patches: ModelPatch[] = []
  if (next.name !== model.name) patches.push({ field: 'name', value: next.name })
  if (next.manufacturer !== model.manufacturer) patches.push({ field: 'manufacturer', value: next.manufacturer })
  if (next.warrantyMonths !== undefined && next.warrantyMonths !== model.warrantyMonths) patches.push({ field: 'warrantyMonths', value: next.warrantyMonths })
  if (next.expectedLifespanMonths !== undefined && next.expectedLifespanMonths !== model.expectedLifespanMonths) patches.push({ field: 'expectedLifespanMonths', value: next.expectedLifespanMonths })
  if (!sameSet(next.materials, model.materials.map((material) => material.code))) patches.push({ field: 'materials', value: next.materials })
  return patches
}
