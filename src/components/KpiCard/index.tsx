import styles from '../../../styles/components/Dashboard/Dashboard.module.css'
import type { KpiCardProps } from '../../types/componentes/KpiCard'

export function KpiCard({ title, value, icon, iconTone, note, noteTone = 'navy' }: KpiCardProps) {
  return (
    <article className={styles.kpi}>
      <span className={`${styles.kpiIcon} ${styles[`tone_${iconTone}`]}`} aria-hidden="true">{icon}</span>
      <h2 className={styles.kpiTitle}>{title}</h2>
      <p className={styles.kpiValue}>{value}</p>
      {note && <p className={`${styles.kpiNote} ${styles[`note_${noteTone}`]}`}>{note}</p>}
    </article>
  )
}
