import styles from '../../../styles/components/Items/Items.module.css'
import type { ConfirmDialogProps } from '../../types/componentes/ConfirmDialog'
import { Button } from '../Button'
import { Dialog } from '../Dialog'

/** A question the person answers inside the page (no `window.confirm`): Esc and "cancel" both keep things as they are. */
export function ConfirmDialog({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open title={title} onClose={onCancel} width={26}>
      <div className={styles.form}>
        <p>{message}</p>
        <div className={styles.actions}>
          <Button variante="secundario" onClick={onCancel}>{cancelLabel}</Button>
          <Button variante="perigo" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Dialog>
  )
}
