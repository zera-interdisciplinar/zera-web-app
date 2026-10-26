import type { ReactNode } from 'react'
import styles from './Dashboard.module.css'

export type Tone = 'navy' | 'green' | 'amber'

interface Props {
  title: string
  value: string
  icon: ReactNode
  iconTone: Tone
  note?: ReactNode
  noteTone?: Tone
}

export function KpiCard({ title, value, icon, iconTone, note, noteTone = 'navy' }: Props) {
  return (
    <article className={styles.kpi}>
      <span className={`${styles.kpiIcon} ${styles[`tone_${iconTone}`]}`} aria-hidden="true">{icon}</span>
      <h2 className={styles.kpiTitle}>{title}</h2>
      <p className={styles.kpiValue}>{value}</p>
      {note && <p className={`${styles.kpiNote} ${styles[`note_${noteTone}`]}`}>{note}</p>}
    </article>
  )
}
