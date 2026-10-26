import { dashboardCopy } from '../copy'
import type { OverviewStatus } from '../hooks/overviewState'
import styles from './Dashboard.module.css'

export function ConnectionBadge({ status }: { status: OverviewStatus }) {
  return <span className={`${styles.badge} ${styles[`badge_${status}`]}`} role="status" aria-live="polite">{dashboardCopy.connection[status]}</span>
}
