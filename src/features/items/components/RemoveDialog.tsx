import { Button } from '../../../components/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { useItemAction } from '../hooks/mutations'
import { failureMessage } from '../hooks/useItemCommands'
import type { ItemResponse } from '../schemas/item'
import styles from './Items.module.css'

interface Props {
  item: ItemResponse
  onClose: () => void
  onDone: (message: string) => void
}

/** Removal is logical (BR-13): the item leaves the lists and can be restored. */
export function RemoveDialog({ item, onClose, onDone }: Props) {
  const { remove } = useItemAction()
  return (
    <Dialog open title="Remover item" onClose={onClose} width={30}>
      <div className={styles.form}>
        <p>Remover <strong>{item.name ?? item.displayCode ?? item.barcode}</strong>? O item sai das listagens e pode ser restaurado depois.</p>
        {remove.isError && <p role="alert" className={styles.formAlertLight}>{failureMessage(remove.error)}</p>}
        <div className={styles.actions}>
          <Button variante="secundario" onClick={onClose}>Cancelar</Button>
          <Button variante="perigo" disabled={remove.isPending} onClick={() => remove.mutate(item.id, { onSuccess: () => onDone('Item removido.') })}>
            {remove.isPending ? 'Removendo…' : 'Remover'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
