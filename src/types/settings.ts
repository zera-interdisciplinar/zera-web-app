import type { z } from 'zod'
import type { settingsFormSchema, unitSettingsSchema } from '../utils/settingsValidation'

export type UnitSettings = z.infer<typeof unitSettingsSchema>

export type SettingsFormInput = z.input<typeof settingsFormSchema>

export type SettingsFormValues = z.output<typeof settingsFormSchema>
