import { z } from 'zod'
import { DAMAGE_TYPES, ITEM_CONDITIONS, MATERIAL_CODES } from './item'

/** Empty inputs arrive as '' and must mean "not informed", not zero. */
const optionalInt = (min: number, max: number, message: string) =>
  z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : Number(value)), z.number({ message }).int(message).min(min, message).max(max, message).optional())

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional().transform((value) => (value === '' ? undefined : value))

/** Today as YYYY-MM-DD in the user's calendar, to refuse future dates without timezone surprises. */
export function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const MODEL_MESSAGE = {
  name: 'Informe o nome do modelo.', manufacturer: 'Informe o fabricante.', categoryId: 'Selecione a categoria.',
  materials: 'Selecione ao menos um material.', estimatedWeightKg: 'O peso deve ser maior que zero.',
}

export const newModelSchema = z.object({
  name: z.string().trim().min(1, MODEL_MESSAGE.name).max(120, 'O nome é longo demais.'),
  manufacturer: z.string().trim().min(1, MODEL_MESSAGE.manufacturer).max(120, 'O fabricante é longo demais.'),
  categoryId: z.string().min(1, MODEL_MESSAGE.categoryId),
  materials: z.array(z.enum(MATERIAL_CODES)).min(1, MODEL_MESSAGE.materials),
  estimatedWeightKg: z.preprocess((value) => (value === '' || value === null || value === undefined ? undefined : Number(value)), z.number({ message: 'Informe um peso válido.' }).positive(MODEL_MESSAGE.estimatedWeightKg).optional()),
})

/** Fields shared by the create and edit forms (BR-11). */
const itemFields = {
  name: z.string().trim().min(1, 'Informe o nome do item.').max(120, 'O nome tem no máximo 120 caracteres.'),
  condition: z.enum(ITEM_CONDITIONS, { message: 'Selecione a condição.' }),
  hasDamages: z.enum(['yes', 'no'], { message: 'Informe se o item tem danos.' }),
  damages: z.array(z.enum(DAMAGE_TYPES)).default([]),
  usageIntensity: optionalInt(0, 10, 'Informe um número inteiro de 0 a 10.').refine((value) => value !== undefined, 'Informe a intensidade de uso (0 a 10).'),
  serialNumber: optionalText(120, 'O número de série tem no máximo 120 caracteres.'),
  acquiredAt: z.string().optional().refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Data inválida.').refine((value) => !value || value <= today(), 'A data de aquisição não pode ser futura.'),
  manufacturingYear: optionalInt(1970, new Date().getFullYear(), `Informe um ano entre 1970 e ${new Date().getFullYear()}.`),
  notes: optionalText(500, 'As observações têm no máximo 500 caracteres.'),
}

/**
 * Cross-field rules run even when another field is already wrong (`when`), so one submit shows every problem
 * instead of revealing them one at a time.
 */
const always = () => true

type DamageFields = { hasDamages?: unknown; damages?: unknown }
const damagesRule = { path: ['damages'], message: 'Selecione ao menos um tipo de dano.', when: always }
const hasDamagesWithoutType = (value: DamageFields) => value.hasDamages === 'yes' && !(Array.isArray(value.damages) && value.damages.length > 0)

export const createItemSchema = z
  .object({
    barcode: z.string().trim().min(1, 'Informe o código de barras.').max(128, 'O código é longo demais.'),
    modelMode: z.enum(['existing', 'new']),
    modelId: z.string().optional(),
    /** What the new-model block holds while it is being typed; it is only validated when that mode is chosen. */
    model: z.object({ name: z.string(), manufacturer: z.string(), categoryId: z.string(), materials: z.array(z.enum(MATERIAL_CODES)), estimatedWeightKg: z.unknown() }).partial().optional(),
    ...itemFields,
  })
  .refine((value) => !hasDamagesWithoutType(value), damagesRule)
  .refine((value) => value.modelMode !== 'existing' || Boolean(value.modelId), { path: ['modelId'], message: 'Selecione o modelo ou cadastre um novo.', when: always })
  .refine((value) => value.modelMode !== 'new' || newModelSchema.shape.name.safeParse(value.model?.name).success, { path: ['model', 'name'], message: MODEL_MESSAGE.name, when: always })
  .refine((value) => value.modelMode !== 'new' || newModelSchema.shape.manufacturer.safeParse(value.model?.manufacturer).success, { path: ['model', 'manufacturer'], message: MODEL_MESSAGE.manufacturer, when: always })
  .refine((value) => value.modelMode !== 'new' || newModelSchema.shape.categoryId.safeParse(value.model?.categoryId).success, { path: ['model', 'categoryId'], message: MODEL_MESSAGE.categoryId, when: always })
  .refine((value) => value.modelMode !== 'new' || newModelSchema.shape.materials.safeParse(value.model?.materials).success, { path: ['model', 'materials'], message: MODEL_MESSAGE.materials, when: always })
  .refine((value) => value.modelMode !== 'new' || newModelSchema.shape.estimatedWeightKg.safeParse(value.model?.estimatedWeightKg).success, { path: ['model', 'estimatedWeightKg'], message: MODEL_MESSAGE.estimatedWeightKg, when: always })
  // Exactly one of modelId / model leaves the form (BR-11), already trimmed and typed.
  .transform((value) => {
    const model = value.modelMode === 'new' ? newModelSchema.safeParse(value.model ?? {}) : undefined
    return { ...value, modelId: value.modelMode === 'existing' ? value.modelId : undefined, model: model?.success ? model.data : undefined }
  })

export const editItemSchema = z.object(itemFields).refine((value) => !hasDamagesWithoutType(value), damagesRule)

export type CreateItemInput = z.input<typeof createItemSchema>
export type CreateItemValues = z.output<typeof createItemSchema>
export type EditItemInput = z.input<typeof editItemSchema>
export type EditItemValues = z.output<typeof editItemSchema>

export const rejectSchema = z.object({ reason: z.string().trim().min(1, 'Informe o motivo da reprovação.').max(500, 'O motivo tem no máximo 500 caracteres.') })
