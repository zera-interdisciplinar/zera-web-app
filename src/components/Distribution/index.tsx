import { formatCount, formatPercent } from '../../utils/dashboardFormat'
import styles from '../../../styles/components/Dashboard/Dashboard.module.css'
import type { DistributionProps } from '../../types/componentes/Distribution'

/** Horizontal bars with the numbers written out: nothing depends on seeing the bar. */
export function Distribution({ title, rows, emptyText }: DistributionProps) {
  const max = Math.max(1, ...rows.map((row) => row.quantity))
  return (
    <section className={styles.distribution} aria-label={title}>
      <h3 className={styles.distributionTitle}>{title}</h3>
      {rows.length === 0 ? <p role="status" className={styles.empty}>{emptyText}</p> : (
        <ul>
          {rows.map((row) => (
            <li key={row.key}>
              <span className={styles.rowLabel}>{row.label}</span>
              <span className={styles.rowBar} aria-hidden="true"><span style={{ width: `${(row.quantity / max) * 100}%` }} /></span>
              <span className={styles.rowValue}>{formatCount(row.quantity)}{row.percent !== null && <small> ({formatPercent(row.percent)})</small>}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
