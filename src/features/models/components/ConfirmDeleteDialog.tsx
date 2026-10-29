import { Button } from '../../../components/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import styles from './Models.module.css'

interface Props {
  title: string
  message: string
  pending: boolean
  /** Already translated; shown when the server refuses (for example, a 409 because it is in use). */
  error?: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDeleteDialog({ title, message, pending, error, confirmLabel = 'Excluir', onConfirm, onClose }: Props) {
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
