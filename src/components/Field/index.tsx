import styles from '../../../styles/components/Field/Field.module.css'
import type { FieldProps } from '../../types/componentes/Field'

/** The frame shared by the text, area and select fields: label, control, hint and error. */
export function Field({ id, label, error, hint, tone = 'light', children, required }: FieldProps) {
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
