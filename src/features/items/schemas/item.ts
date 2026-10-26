import { z } from 'zod'
import { isoDate, isoDateTime, pageSchema } from '../../../shared/api/schemas'

/** Closed lists taken from the ms-inventory source (spec section 5.4). A value outside them is a contract error. */
export const ITEM_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'IN_STOCK', 'IN_USE', 'IN_MAINTENANCE', 'AWAITING_EVALUATION', 'DISPOSED', 'REMOVED'] as const
export const ITEM_CONDITIONS = ['NEW', 'USED', 'SEMI_DAMAGED', 'DAMAGED'] as const
export const DAMAGE_TYPES = ['BROKEN_SCREEN', 'MISSING_PART', 'DOES_NOT_POWER_ON', 'OXIDATION', 'OTHER'] as const
export const MATERIAL_CODES = ['PLASTIC', 'METAL', 'GLASS', 'PAPER', 'BATTERY', 'CIRCUIT_BOARD', 'CABLE', 'SCREEN', 'OTHER'] as const
export const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const
export const EVENT_TYPES = ['CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'MAINTENANCE_STARTED', 'MAINTENANCE_FINISHED', 'EVALUATED', 'LOAN_STARTED', 'LOAN_RETURNED', 'DISPOSED', 'DISPOSAL_CANCELLED', 'REMOVED', 'RESTORED', 'STATUS_CHANGED'] as const

export type ItemStatus = (typeof ITEM_STATUSES)[number]
export type ItemCondition = (typeof ITEM_CONDITIONS)[number]
export type DamageType = (typeof DAMAGE_TYPES)[number]
export type MaterialCode = (typeof MATERIAL_CODES)[number]

export const categorySchema = z.object({
  id: z.string().min(1),
  unitId: z.string().nullish(),
  name: z.string().min(1),
  description: z.string().nullish(),
})

export const materialSchema = z.object({
  id: z.string().min(1),
  code: z.enum(MATERIAL_CODES),
  name: z.string().min(1),
  recyclable: z.boolean(),
  hazardous: z.boolean(),
  disposalGuide: z.string().nullish(),
})

export const modelSchema = z.object({
  id: z.string().min(1),
  unitId: z.string().nullish(),
  name: z.string().min(1),
  manufacturer: z.string(),
  expectedLifespanMonths: z.number().int().nonnegative().nullish(),
  warrantyMonths: z.number().int().nonnegative().nullish(),
  estimatedWeightKg: z.number().nonnegative().nullish(),
  materials: z.array(materialSchema),
  notes: z.string().nullish(),
  category: categorySchema,
  approvalStatus: z.enum(APPROVAL_STATUSES),
})
export type Model = z.infer<typeof modelSchema>

/** Optional fields may come omitted or null: both mean "no value". */
export const itemSchema = z.object({
  id: z.string().min(1),
  barcode: z.string().min(1),
  displayCode: z.string().nullish(),
  name: z.string().nullish(),
  status: z.enum(ITEM_STATUSES),
  condition: z.enum(ITEM_CONDITIONS).nullish(),
  hasDamages: z.boolean().nullish(),
  damages: z.array(z.enum(DAMAGE_TYPES)).nullish(),
  notes: z.string().nullish(),
  photoUrl: z.string().nullish(),
  unitId: z.string().min(1),
  model: modelSchema.nullish(),
  serialNumber: z.string().nullish(),
  acquiredAt: isoDate.nullish(),
  manufacturingYear: z.number().int().nullish(),
  usageIntensity: z.number().int().min(0).max(10).nullish(),
  predictedFailureDate: isoDate.nullish(),
  predictionUpdatedAt: isoDateTime.nullish(),
  missingFields: z.array(z.string()).nullish(),
  lastEventAt: isoDateTime.nullish(),
  createdBy: z.string().nullish(),
  createdByName: z.string().nullish(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
})
export type ItemResponse = z.infer<typeof itemSchema>

export const itemPageSchema = pageSchema(itemSchema)
export const modelPageSchema = pageSchema(modelSchema)

export const eventSchema = z.object({
  id: z.string().min(1),
  itemId: z.string().min(1),
  type: z.enum(EVENT_TYPES),
  fromStatus: z.enum(ITEM_STATUSES).nullish(),
  toStatus: z.enum(ITEM_STATUSES).nullish(),
  reason: z.string().nullish(),
  actorId: z.string().nullish(),
  actorName: z.string().nullish(),
  occurredAt: isoDateTime,
})
export type ItemEvent = z.infer<typeof eventSchema>
export const eventPageSchema = pageSchema(eventSchema)
