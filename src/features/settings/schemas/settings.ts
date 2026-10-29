import { z } from 'zod'
import { isoDateTime } from '../../../shared/api/schemas'

/** `stockCapacity` is null until the unit configures it: that means "not configured", not zero (BR-18). */
export const unitSettingsSchema = z.object({
  unitId: z.string().nullish(),
  stockCapacity: z.number().int().nonnegative().nullish(),
  configured: z.boolean().nullish(),
  updatedByName: z.string().nullish(),
  updatedAt: isoDateTime.nullish(),
})
export type UnitSettings = z.infer<typeof unitSettingsSchema>

export const settingsFormSchema = z.object({
  stockCapacity: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
    z.number({ message: 'Informe a capacidade do estoque.' }).int('Use um número inteiro.').min(0, 'A capacidade não pode ser negativa.').max(2_147_483_647, 'Valor alto demais.'),
  ),
})
export type SettingsFormInput = z.input<typeof settingsFormSchema>
export type SettingsFormValues = z.output<typeof settingsFormSchema>
