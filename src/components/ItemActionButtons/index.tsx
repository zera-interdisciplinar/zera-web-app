import { Check, Pencil, RotateCcw, Trash2, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { ACTION_LABEL, availableActions } from '../../utils/itemActions'
import styles from '../../../styles/components/Items/Items.module.css'
import type { ItemActionButtonsProps } from '../../types/componentes/ItemActionButtons'
import type { ItemAction } from '../../types/item'

const ICON: Record<ItemAction, ReactNode> = {
  edit: <Pencil aria-hidden="true" />, remove: <Trash2 aria-hidden="true" />, approve: <Check aria-hidden="true" />,
  reject: <X aria-hidden="true" />, restore: <RotateCcw aria-hidden="true" />, submit: <Check aria-hidden="true" />,
}

export function ItemActionButtons({ item, onAction, disabled }: ItemActionButtonsProps) {
  const name = item.name ?? item.displayCode ?? item.barcode
  return (
    <div className={styles.rowActions}>
      {availableActions(item).map((action) => {
        return (
          <button key={action} type="button" className={`${styles.rowAction} ${styles[`action_${action}`]}`} disabled={disabled}
            aria-label={`${ACTION_LABEL[action]} ${name}`} title={ACTION_LABEL[action]} onClick={() => onAction(action, item)}>
            {ICON[action]}
          </button>
        )
      })}
    </div>
  )
}
