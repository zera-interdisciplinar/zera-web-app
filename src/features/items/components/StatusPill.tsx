import { STATUS_LABEL, STATUS_TONE } from '../model/labels'
import type { ItemStatus } from '../schemas/item'
import styles from './Items.module.css'

/** Color never carries the status alone: the label is always written out. */
export function StatusPill({ status }: { status: ItemStatus }) {
  return <span className={`${styles.pill} ${styles[`tone_${STATUS_TONE[status]}`]}`}>{STATUS_LABEL[status]}</span>
}
