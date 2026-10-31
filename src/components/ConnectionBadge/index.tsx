import { dashboardCopy } from '../../utils/dashboardCopy'
import styles from '../../../styles/components/Dashboard/Dashboard.module.css'
import type { ConnectionBadgeProps } from '../../types/componentes/ConnectionBadge'

export function ConnectionBadge({ status }: ConnectionBadgeProps) {
  return <span className={`${styles.badge} ${styles[`badge_${status}`]}`} role="status" aria-live="polite">{dashboardCopy.connection[status]}</span>
}
