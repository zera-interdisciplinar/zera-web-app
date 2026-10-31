import { useId } from 'react'
import type { SelectFieldProps } from '../../types/componentes/Field'
import { describedBy } from '../../utils/fieldAria'
import { Field } from '../Field'

export function SelectField({ label, error, hint, tone, required, children, ...select }: SelectFieldProps) {
  const generated = useId()
  const id = select.id ?? generated
  return (
    <Field id={id} label={label} error={error} hint={hint} tone={tone} required={required}>
      <select {...select} id={id} aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)}>{children}</select>
    </Field>
  )
}
