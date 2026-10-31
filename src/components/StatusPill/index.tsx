import { STATUS_LABEL, STATUS_TONE } from '../../utils/itemLabels'
import styles from '../../../styles/components/Items/Items.module.css'
import type { StatusPillProps } from '../../types/componentes/StatusPill'

/** Color never carries the status alone: the label is always written out. */
export function StatusPill({ status }: StatusPillProps) {
  return <span className={`${styles.pill} ${styles[`tone_${STATUS_TONE[status]}`]}`}>{STATUS_LABEL[status]}</span>
}
