import { Check, Pencil, RotateCcw, Trash2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { ACTION_LABEL, availableActions, type ItemAction } from '../model/actions'
import type { ItemResponse } from '../schemas/item'
import styles from './Items.module.css'

const ICON: Record<ItemAction, ReactNode> = {
  edit: <Pencil aria-hidden="true" />, remove: <Trash2 aria-hidden="true" />, approve: <Check aria-hidden="true" />,
  reject: <X aria-hidden="true" />, restore: <RotateCcw aria-hidden="true" />, submit: <Check aria-hidden="true" />,
}

interface Props {
  item: ItemResponse
  onAction: (action: ItemAction, item: ItemResponse) => void
  disabled?: boolean
  /** In the table, edit and remove are icons (as in the Figma) and the rest are short text buttons. */
  compact?: boolean
}

export function ItemActionButtons({ item, onAction, disabled, compact }: Props) {
  const name = item.name ?? item.displayCode ?? item.barcode
  return (
    <div className={styles.rowActions}>
      {availableActions(item).map((action) => {
        const iconOnly = compact && (action === 'edit' || action === 'remove')
        return (
          <button key={action} type="button" className={`${styles.rowAction} ${styles[`action_${action}`]}`} disabled={disabled}
            aria-label={`${ACTION_LABEL[action]} ${name}`} title={ACTION_LABEL[action]} onClick={() => onAction(action, item)}>
            {ICON[action]}
            {!iconOnly && <span>{ACTION_LABEL[action]}</span>}
          </button>
        )
      })}
    </div>
  )
}
