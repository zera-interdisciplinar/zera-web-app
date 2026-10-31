import { useId } from 'react'
import styles from '../../../styles/components/Field/Field.module.css'
import type { ChoiceGroupProps } from '../../types/componentes/Field'

/** A group of checkboxes or radios under one legend, with a single error message for the group. */
export function ChoiceGroup({ legend, error, tone = 'light', children, required }: ChoiceGroupProps) {
  const id = useId()
  return (
    <fieldset className={`${styles.group} ${styles[tone]}`} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined}>
      <legend>{legend}{required && <span aria-hidden="true"> *</span>}</legend>
      <div className={styles.choices}>{children}</div>
      {error && <p id={`${id}-error`} role="alert" className={styles.error}>{error}</p>}
    </fieldset>
  )
}
