import styles from '../../../styles/components/Items/Items.module.css'
import { useEditItemForm } from '../../hooks/useEditItemForm'
import type { EditItemDialogProps } from '../../types/componentes/EditItemDialog'
import type { ItemFieldErrors } from '../../types/item'
import { fieldLabel } from '../../utils/itemLabels'
import { Button } from '../Button'
import { ConfirmDialog } from '../ConfirmDialog'
import { Dialog } from '../Dialog'
import { ItemFields } from '../ItemFields'


export function EditItemDialog({ item, missingFields = [], onClose, onSaved }: EditItemDialogProps) {
  const { register, errors, setValue, hasDamages, finishes, pending, general, asking, requestClose, confirmDiscard, keepEditing, submit } = useEditItemForm({ item, missingFields, onClose, onSaved })

  return (
    <>
      <Dialog open title={`Editar item${item.displayCode ? ` ${item.displayCode}` : ''}`} description="Atualize os campos do item e salve as alterações." tone="navy" width={44} onClose={requestClose}>
        <form className={styles.form} onSubmit={submit} noValidate>
          {missingFields.length > 0 && (
            <p role="alert" className={styles.formAlert}>
              O item foi salvo como rascunho. Faltam: {missingFields.map(fieldLabel).join(', ')}.
            </p>
          )}
          {general && <p role="alert" className={styles.formAlert}>{general}</p>}
          <p className={styles.readonly}>Código de barras: <strong>{item.barcode}</strong>{item.model && <> · Modelo: <strong>{item.model.name}</strong></>}</p>
          <ItemFields register={(name) => register(name)} errors={errors as ItemFieldErrors} hasDamages={hasDamages} onClear={(field) => setValue(field, '', { shouldDirty: true })} />
          <div className={styles.actions}>
            <Button variante="secundario" onClick={requestClose}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : finishes ? 'Salvar e concluir cadastro' : 'Salvar alterações'}</Button>
          </div>
        </form>
      </Dialog>
      {asking && <ConfirmDialog title="Descartar alterações?" message="Descartar as alterações? O que foi digitado será perdido." confirmLabel="Descartar" cancelLabel="Continuar editando" onConfirm={confirmDiscard} onCancel={keepEditing} />}
    </>
  )
}
