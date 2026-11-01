import { Button } from '../Button'
import { Dialog } from '../Dialog'
import { useItemRemoval } from '../../hooks/useRemovalCommands'
import { failureMessage } from '../../hooks/useItemCommands'
import styles from '../../../styles/components/Items/Items.module.css'
import type { RemoveDialogProps } from '../../types/componentes/RemoveDialog'

/** Removal is logical (BR-13): the item leaves the lists and can be restored. */
export function RemoveDialog({ item, onClose, onDone }: RemoveDialogProps) {
  const { remove, confirmRemoval } = useItemRemoval(item.id, onDone)
  return (
    <Dialog open title="Remover item" onClose={onClose} width={30}>
      <div className={styles.form}>
        <p>Remover <strong>{item.name ?? item.displayCode ?? item.barcode}</strong>? O item sai das listagens e pode ser restaurado depois.</p>
        {remove.isError && <p role="alert" className={styles.formAlertLight}>{failureMessage(remove.error)}</p>}
        <div className={styles.actions}>
          <Button variante="secundario" data-autofocus onClick={onClose}>Cancelar</Button>
          <Button variante="perigo" disabled={remove.isPending} onClick={confirmRemoval}>
            {remove.isPending ? 'Removendo…' : 'Remover'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
