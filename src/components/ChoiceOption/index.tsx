import { useId } from 'react'
import styles from '../../../styles/components/Field/Field.module.css'
import type { ChoiceOptionProps } from '../../types/componentes/Field'

/** One radio or checkbox with its label tied by `htmlFor`; goes inside a `ChoiceGroup`. */
export function ChoiceOption({ label, id, ...input }: ChoiceOptionProps) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <span className={styles.option}>
      <input {...input} id={inputId} />
      <label htmlFor={inputId}>{label}</label>
    </span>
  )
}
