import { useId } from 'react'
import type { TextFieldProps } from '../../types/componentes/Field'
import { describedBy } from '../../utils/fieldAria'
import { Field } from '../Field'

/** Text-like input; works with react-hook-form's `register` because `ref` is a regular prop in React 19. */
export function TextField({ label, error, hint, tone, required, ...input }: TextFieldProps) {
  const generated = useId()
  const id = input.id ?? generated
  return (
    <Field id={id} label={label} error={error} hint={hint} tone={tone} required={required}>
      <input {...input} id={id} required={required} aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} />
    </Field>
  )
}
