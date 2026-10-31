import { useId } from 'react'
import type { TextAreaFieldProps } from '../../types/componentes/Field'
import { describedBy } from '../../utils/fieldAria'
import { Field } from '../Field'

export function TextAreaField({ label, error, hint, tone, required, ...input }: TextAreaFieldProps) {
  const generated = useId()
  const id = input.id ?? generated
  return (
    <Field id={id} label={label} error={error} hint={hint} tone={tone} required={required}>
      <textarea {...input} id={id} rows={input.rows ?? 3} aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} />
    </Field>
  )
}
