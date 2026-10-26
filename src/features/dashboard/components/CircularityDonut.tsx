import { formatPercent } from '../model/format'
import styles from './Dashboard.module.css'

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Percentage ring. There is no "goal" here: the product has none (BR-22). */
export function CircularityDonut({ percent }: { percent: number | null }) {
  const clamped = percent === null ? 0 : Math.min(100, Math.max(0, percent))
  return (
    <figure className={styles.card} aria-labelledby="circularity-title">
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
            <circle cx="64" cy="64" r={RADIUS} className={styles.donutArc} strokeDasharray={`${(clamped / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`} transform="rotate(-90 64 64)" />
          </svg>
          <span className={styles.donutValue}>{formatPercent(percent)}</span>
        </div>
      )}
    </figure>
  )
}
