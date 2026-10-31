import { CreateItemDialog } from '../CreateItemDialog'
import { EditItemDialog } from '../EditItemDialog'
import { RejectDialog } from '../RejectDialog'
import { RemoveDialog } from '../RemoveDialog'
import type { ItemDialogHostProps } from '../../types/componentes/ItemDialogHost'

/** The one place that knows which dialog is open, so lists and the detail page share it. */
export function ItemDialogHost({ target, onTarget, notify }: ItemDialogHostProps) {
  const close = () => onTarget(null)
  const done = (message: string) => { notify(message); close() }
  if (!target) return null
  switch (target.kind) {
    case 'create':
      return <CreateItemDialog onClose={close} onCreated={done} onDraft={(item, missingFields) => { notify('Item salvo como rascunho: faltam dados para concluir o cadastro.'); onTarget({ kind: 'edit', item, missingFields }) }} />
    case 'edit':
      return <EditItemDialog key={target.item.id} item={target.item} missingFields={target.missingFields} onClose={close} onSaved={done} />
    case 'reject':
      return <RejectDialog item={target.item} onClose={close} onDone={done} />
    case 'remove':
      return <RemoveDialog item={target.item} onClose={close} onDone={done} />
  }
}
