import styles from '../../../styles/components/Items/Items.module.css'
import { failureMessage } from '../../hooks/useItemCommands'
import { useRejectForm } from '../../hooks/useRejectForm'
import type { RejectDialogProps } from '../../types/componentes/RejectDialog'
import { Button } from '../Button'
import { Dialog } from '../Dialog'
import { TextAreaField } from '../TextAreaField'

const MAX_REASON = 500

/** The reason is mandatory and travels to the employee who registered the item (BR-14). */
export function RejectDialog({ item, onClose, onDone }: RejectDialogProps) {
  const { register, errors, reason, reject, submit } = useRejectForm({ item, onClose, onDone })

  return (
    <Dialog open title="Reprovar item" description={`Informe o motivo da reprovação de ${item.name ?? item.displayCode ?? item.barcode}.`} onClose={onClose} width={32}>
      <form className={styles.form} onSubmit={submit} noValidate>
        <p>Informe o motivo da reprovação de <strong>{item.name ?? item.displayCode ?? item.barcode}</strong>.</p>
        {reject.isError && <p role="alert" className={styles.formAlertLight}>{failureMessage(reject.error)}</p>}
        <TextAreaField label="Motivo" required rows={4} maxLength={MAX_REASON} error={errors.reason?.message}
          hint={`${reason.length}/${MAX_REASON} caracteres`} {...register('reason')} />
        <div className={styles.actions}>
          <Button variante="secundario" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variante="perigo" disabled={reject.isPending}>{reject.isPending ? 'Reprovando…' : 'Reprovar'}</Button>
        </div>
      </form>
    </Dialog>
  )
}
