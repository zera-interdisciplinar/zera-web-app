import { z } from 'zod'
import { MATERIAL_CODES } from './itemSchemas'

/** Empty inputs arrive as '' and mean "not informed". */
const emptyToUndefined = (value: unknown) => (value === '' || value === null || value === undefined ? undefined : typeof value === 'string' ? Number(value) : value)

const positiveInt = (message: string) => z.preprocess(emptyToUndefined, z.number({ message }).int(message).positive(message).max(2_147_483_647, message).optional())

const NAME = z.string().trim().min(1, 'Informe o nome.').max(120, 'O nome tem no máximo 120 caracteres.')

export const categoryFormSchema = z.object({
  name: NAME,
  description: z.string().trim().min(1, 'Informe a descrição.').max(500, 'A descrição tem no máximo 500 caracteres.'),
})

/** BR-17: name, manufacturer, category and materials are required; the rest is optional but positive. */
export const modelFormSchema = z.object({
  name: NAME,
  manufacturer: z.string().trim().min(1, 'Informe o fabricante.').max(120, 'O fabricante tem no máximo 120 caracteres.'),
  categoryId: z.string().min(1, 'Selecione a categoria.'),
  materials: z.array(z.enum(MATERIAL_CODES)).min(1, 'Selecione ao menos um material.'),
  estimatedWeightKg: z.preprocess(emptyToUndefined, z.number({ message: 'Informe um peso válido.' }).positive('O peso deve ser maior que zero.').optional()),
  warrantyMonths: positiveInt('Informe um número inteiro de meses maior que zero.'),
  expectedLifespanMonths: positiveInt('Informe um número inteiro de meses maior que zero.'),
  notes: z.string().trim().max(500, 'As observações têm no máximo 500 caracteres.').optional().transform((value) => value || undefined),
})
