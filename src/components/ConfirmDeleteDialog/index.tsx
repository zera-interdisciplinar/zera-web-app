import { Button } from '../Button'
import { Dialog } from '../Dialog'
import styles from '../../../styles/components/Models/Models.module.css'
import type { ConfirmDeleteDialogProps } from '../../types/componentes/ConfirmDeleteDialog'

export function ConfirmDeleteDialog({ title, message, pending, error, confirmLabel = 'Excluir', onConfirm, onClose }: ConfirmDeleteDialogProps) {
  return (
    <Dialog open title={title} onClose={onClose} width={30}>
      <div className={styles.form}>
        <p>{message}</p>
        {error && <p role="alert" className={styles.formAlertLight}>{error}</p>}
        <div className={styles.actions}>
          <Button variante="secundario" onClick={onClose}>Cancelar</Button>
          <Button variante="perigo" disabled={pending} onClick={onConfirm}>{pending ? 'Excluindo…' : confirmLabel}</Button>
        </div>
      </div>
    </Dialog>
  )
}
