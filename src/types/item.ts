import type { categorySchema, materialSchema, itemPageSchema, eventPageSchema, modelPageSchema, DAMAGE_TYPES, ITEM_CONDITIONS, ITEM_STATUSES, MATERIAL_CODES, eventSchema, itemSchema, modelSchema } from '../utils/itemSchemas'
import type { z } from 'zod'
import type { createItemSchema, editItemSchema } from '../utils/itemValidation'

export type ItemStatus = (typeof ITEM_STATUSES)[number]

export type ItemCondition = (typeof ITEM_CONDITIONS)[number]

export type DamageType = (typeof DAMAGE_TYPES)[number]

export type MaterialCode = (typeof MATERIAL_CODES)[number]

export interface Model extends z.infer<typeof modelSchema> {}

export interface ItemResponse extends z.infer<typeof itemSchema> {}

export interface ItemEvent extends z.infer<typeof eventSchema> {}

export type ItemAction = 'edit' | 'approve' | 'reject' | 'submit' | 'remove' | 'restore'

export type StatusTone = 'amber' | 'green' | 'blue' | 'gray' | 'neutral'

export interface CreateItemRequest {
  id: string
  barcode: string
  modelId?: string
  model?: { name: string; manufacturer: string; materials: string[]; estimatedWeightKg?: number; categoryId: string }
  name: string
  condition: string
  hasDamages: boolean
  damages?: string[]
  usageIntensity: number
  serialNumber?: string
  acquiredAt?: string
  manufacturingYear?: number
  notes?: string
}

export type UpdateItemRequest = Partial<{
  name: string; condition: string; hasDamages: boolean; damages: string[]; notes: string; serialNumber: string
  acquiredAt: string; manufacturingYear: number; usageIntensity: number
}>

export interface FormFailure {
  /** Errors to show next to a field, keyed by the form path (for example `barcode` or `model.name`). */
  fields: Record<string, string>
  /** Shown above the form when nothing could be tied to a field. */
  general?: string
}

export interface ListItemsParams {
  page: number
  size: number
  q?: string
  status?: ItemStatus
  categoryId?: string
  modelId?: string
}

export type Notify = (message: string) => void

export interface CreateItemResult {
  item: ItemResponse
  /** False when the item was saved but is still a draft because the submit asked for more data (HTTP 422). */
  submitted: boolean
  missingFields: string[]
}

export type CreateItemInput = z.input<typeof createItemSchema>

export type CreateItemValues = z.output<typeof createItemSchema>

export type EditItemInput = z.input<typeof editItemSchema>

export type EditItemValues = z.output<typeof editItemSchema>

export type SharedField = keyof EditItemInput

export type ItemFieldErrors = Partial<Record<SharedField, { message?: string }>>

export interface Category extends z.infer<typeof categorySchema> {}

export interface Material extends z.infer<typeof materialSchema> {}

export interface ItemPage extends z.infer<typeof itemPageSchema> {}

export interface ItemEventPage extends z.infer<typeof eventPageSchema> {}

export interface ModelPage extends z.infer<typeof modelPageSchema> {}

export interface ItemSelectionParams extends Omit<ListItemsParams, "status" | "categoryId"> { statuses: ItemStatus[]; categoryIds: string[] }
