import { toNestErrors } from '@hookform/resolvers'
import type { FieldError, FieldValues, Resolver } from 'react-hook-form'
import type { ZodType } from 'zod'
import { sanitizarObjeto } from './sanitizacao'

/** The outcome of a validation: the clean data, or one message per field path (`model.name`, `damages`...). */
export type ValidationResult<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> }

/**
 * The single gate every form passes before anything reaches a service: types, lengths and ranges come from the
 * schema, and the accepted text is sanitized (tags and dangerous protocols removed) before it is used.
 */
export function validate<T>(schema: ZodType<T>, input: unknown): ValidationResult<T> {
  // Validate the actual value that leaves the form, including text emptied by sanitization.
  // Do this before schema transforms: parsing transformed output again can change optional/numeric fields.
  const parsed = schema.safeParse(sanitizarObjeto(input))
  if (parsed.success) return { ok: true, data: parsed.data }
  const errors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const path = issue.path.join('.')
    // The first message of a field wins: it is the most specific one.
    if (!(path in errors)) errors[path] = issue.message
  }
  return { ok: false, errors }
}

/** `react-hook-form` resolver that runs `validate`, so the form shows exactly the messages of the schema. */
export function resolverFor<I extends FieldValues, O>(schema: ZodType<O, I>): Resolver<I, unknown, O> {
  return (values, _context, options) => {
    const result = validate(schema, values)
    if (result.ok) return { values: result.data, errors: {} }
    const flat: Record<string, FieldError> = {}
    for (const [path, message] of Object.entries(result.errors)) flat[path] = { type: 'validation', message }
    return { values: {}, errors: toNestErrors(flat, options) }
  }
}
