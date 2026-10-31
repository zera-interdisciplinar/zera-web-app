import { z } from 'zod'
import type { FieldErrors } from '../types/auth'

const email = z
  .string()
  .trim()
  .min(1, 'Informe o e-mail.')
  .max(120, 'O e-mail é longo demais.')
  .pipe(z.email('E-mail inválido. Use o formato nome@empresa.com.'))
  .transform((value) => value.toLowerCase())

export const loginSchema = z.object({
  email,
  // Passwords are sent exactly as typed, spaces included.
  password: z.string().min(1, 'Informe a senha.').max(128, 'A senha é longa demais.'),
})

export const forgotPasswordSchema = z.object({ email })

/** Maps zod issues to one message per field (the first one wins). */
export function fieldErrors<Field extends string>(error: z.ZodError): FieldErrors<Field> {
  const errors: FieldErrors<Field> = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0]) as Field
    errors[field] ??= issue.message
  }
  return errors
}
