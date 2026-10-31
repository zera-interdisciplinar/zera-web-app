import { useId } from 'react'
import styles from '../../../styles/components/Field/Field.module.css'
import type { FilterSelectProps } from '../../types/componentes/Field'

/** A labeled `<select>` for list filters and page size (the boxed `SelectField` is for forms). */
export function FilterSelect({ label, id, children, ...select }: FilterSelectProps) {
  const generated = useId()
  const selectId = id ?? generated
  return (
    <div className={styles.filter}>
      <label htmlFor={selectId}>{label}</label>
      <select {...select} id={selectId}>{children}</select>
    </div>
  )
}
