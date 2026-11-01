import { formatPercent } from '../../utils/dashboardFormat'
import styles from '../../../styles/components/Dashboard/Dashboard.module.css'
import type { CircularityDonutProps } from '../../types/componentes/CircularityDonut'

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Percentage ring. There is no "goal" here: the product has none (BR-22). */
export function CircularityDonut({ percent }: CircularityDonutProps) {
  const clamped = percent === null ? 0 : Math.min(100, Math.max(0, percent))
  return (
    <figure className={`${styles.card} ${styles.circularityCard}`} aria-labelledby="circularity-title">
      <figcaption>
        <h2 id="circularity-title" className={styles.cardTitle}>Circularidade</h2>
        <p className={styles.cardSubtitle}>No período selecionado</p>
      </figcaption>
      {percent === null ? (
        <p role="status" className={styles.empty}>A circularidade ainda não foi calculada para este período.</p>
      ) : (
        <div className={styles.donut} role="img" aria-label={`Circularidade: ${formatPercent(percent)}`}>
          <svg viewBox="0 0 128 128" aria-hidden="true" focusable="false">
            <circle cx="64" cy="64" r={RADIUS} className={styles.donutTrack} />
            <circle cx="64" cy="64" r={RADIUS} className={styles.donutArc} opacity={clamped === 0 ? 0 : 1} strokeDasharray={`${(clamped / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`} transform="rotate(-90 64 64)" />
          </svg>
          <div className={styles.donutCenter}><span className={styles.donutValue}>{formatPercent(percent)}</span><span className={styles.donutCaption}>Índice de circularidade</span></div>
        </div>
      )}
      {percent !== null && <div className={styles.circularityScale}><span>0%</span><span>Escala do indicador</span><span>100%</span></div>}
    </figure>
  )
}
