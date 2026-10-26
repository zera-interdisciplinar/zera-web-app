import { useId, type ComponentPropsWithRef, type ReactNode } from 'react'
import styles from './fields.module.css'

interface Common {
  label: string
  error?: string
  hint?: ReactNode
  /** Visual tone of the surrounding container: error colors must stay readable on navy. */
  tone?: 'light' | 'navy'
}

function Field({ id, label, error, hint, tone = 'light', children, required }: Common & { id: string; children: ReactNode; required?: boolean }) {
  return (
    <div className={`${styles.wrap} ${styles[tone]}`}>
      <div className={`${styles.box} ${error ? styles.invalid : ''}`}>
        <label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
        {children}
      </div>
      {hint && <p id={`${id}-hint`} className={styles.hint}>{hint}</p>}
      {error && <p id={`${id}-error`} role="alert" className={styles.error}>{error}</p>}
    </div>
  )
}

const describedBy = (id: string, error?: string, hint?: ReactNode) => [error ? `${id}-error` : '', hint ? `${id}-hint` : ''].filter(Boolean).join(' ') || undefined

/** Text-like input; works with react-hook-form's `register` because `ref` is a regular prop in React 19. */
export function TextField({ label, error, hint, tone, required, ...input }: Common & ComponentPropsWithRef<'input'>) {
  const generated = useId()
  const id = input.id ?? generated
  return (
    <Field id={id} label={label} error={error} hint={hint} tone={tone} required={required}>
      <input {...input} id={id} required={required} aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} />
    </Field>
  )
}

export function TextAreaField({ label, error, hint, tone, required, ...input }: Common & ComponentPropsWithRef<'textarea'>) {
  const generated = useId()
  const id = input.id ?? generated
  return (
    <Field id={id} label={label} error={error} hint={hint} tone={tone} required={required}>
      <textarea {...input} id={id} rows={input.rows ?? 3} aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)} />
    </Field>
  )
}

export function SelectField({ label, error, hint, tone, required, children, ...select }: Common & ComponentPropsWithRef<'select'>) {
  const generated = useId()
  const id = select.id ?? generated
  return (
    <Field id={id} label={label} error={error} hint={hint} tone={tone} required={required}>
      <select {...select} id={id} aria-required={required || undefined} aria-invalid={error ? true : undefined} aria-describedby={describedBy(id, error, hint)}>{children}</select>
    </Field>
  )
}

/** A group of checkboxes or radios under one legend, with a single error message for the group. */
export function ChoiceGroup({ legend, error, tone = 'light', children, required }: { legend: string; error?: string; tone?: 'light' | 'navy'; children: ReactNode; required?: boolean }) {
  const id = useId()
  return (
    <fieldset className={`${styles.group} ${styles[tone]}`} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}>
      <legend>{legend}{required && <span aria-hidden="true"> *</span>}</legend>
      <div className={styles.choices}>{children}</div>
      {error && <p id={`${id}-error`} role="alert" className={styles.error}>{error}</p>}
    </fieldset>
  )
}
