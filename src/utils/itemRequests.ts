import type { CreateItemValues, EditItemValues } from '../types/item'
import type { CreateItemRequest, UpdateItemRequest } from '../types/item'


/**
 * Body of `POST /items`. The client generates the id, which makes a resend after a timeout idempotent
 * (the server answers 200 with the existing item). `unitId` and `status` never go in the body.
 */
export function toCreateRequest(values: CreateItemValues, id: string): CreateItemRequest {
  const hasDamages = values.hasDamages === 'yes'
  const request: CreateItemRequest = {
    id, barcode: values.barcode, name: values.name, condition: values.condition, hasDamages,
    usageIntensity: values.usageIntensity as number,
  }
  if (hasDamages) request.damages = values.damages
  if (values.modelMode === 'existing') request.modelId = values.modelId
  else if (values.model) {
    const { name, manufacturer, categoryId, materials, estimatedWeightKg } = values.model
    request.model = { name, manufacturer, categoryId, materials, ...(estimatedWeightKg === undefined ? {} : { estimatedWeightKg }) }
  }
  if (values.serialNumber) request.serialNumber = values.serialNumber
  if (values.acquiredAt) request.acquiredAt = values.acquiredAt
  if (values.manufacturingYear !== undefined) request.manufacturingYear = values.manufacturingYear
  if (values.notes) request.notes = values.notes
  return request
}

const sameList = (a: string[], b: string[]) => a.length === b.length && [...a].sort().every((value, index) => value === [...b].sort()[index])

/**
 * Body of `PATCH /items/{id}`: only what changed (BR-12). Absent fields are left alone by the server, and an
 * empty string erases `notes` and `serialNumber`; the other optional fields cannot be erased through this API.
 */
export function toUpdateRequest(initial: Partial<EditItemValues>, next: EditItemValues): UpdateItemRequest {
  const request: UpdateItemRequest = {}
  if (next.name !== initial.name) request.name = next.name
  if (next.condition !== initial.condition) request.condition = next.condition
  const hasDamages = next.hasDamages === 'yes'
  if (next.hasDamages !== initial.hasDamages || !sameList(next.damages, initial.damages ?? [])) {
    request.hasDamages = hasDamages
    request.damages = hasDamages ? next.damages : []
  }
  if (next.usageIntensity !== initial.usageIntensity && next.usageIntensity !== undefined) request.usageIntensity = next.usageIntensity
  if (next.serialNumber !== initial.serialNumber) request.serialNumber = next.serialNumber ?? ''
  if (next.notes !== initial.notes) request.notes = next.notes ?? ''
  if (next.acquiredAt !== initial.acquiredAt && next.acquiredAt) request.acquiredAt = next.acquiredAt
  if (next.manufacturingYear !== initial.manufacturingYear && next.manufacturingYear !== undefined) request.manufacturingYear = next.manufacturingYear
  return request
}
