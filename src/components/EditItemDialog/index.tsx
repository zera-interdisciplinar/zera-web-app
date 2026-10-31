import { useForm, useWatch } from 'react-hook-form'
import { Button } from '../Button'
import { Dialog } from '../Dialog'
import { useItemAction } from '../../hooks/useItemMutations'
import { toEditInput, toEditValues } from '../../utils/itemEditValues'
import { toFormFailure } from '../../utils/itemFormErrors'
import { fieldLabel } from '../../utils/itemLabels'
import { toUpdateRequest } from '../../utils/itemRequests'
import { editItemSchema } from '../../utils/itemValidation'
import { ItemFields } from '../ItemFields'
import styles from '../../../styles/components/Items/Items.module.css'
import type { EditItemDialogProps } from '../../types/componentes/EditItemDialog'
import type { EditItemInput, EditItemValues, ItemFieldErrors } from '../../types/item'
import { resolverFor } from '../../utils/validation'
import { useDiscardGuard } from '../../hooks/useDiscardGuard'
import { ConfirmDialog } from '../ConfirmDialog'

/** Drafts and rejected items finish their registration from here: save, then submit (BR-10). */
const FINISHES_REGISTRATION = ['DRAFT', 'REJECTED']

export function EditItemDialog({ item, missingFields = [], onClose, onSaved }: EditItemDialogProps) {
  const { register, handleSubmit, control, setValue, setError, formState: { errors, isDirty } } = useForm<EditItemInput, unknown, EditItemValues>({
    resolver: resolverFor(editItemSchema), defaultValues: toEditInput(item),
  })
  const hasDamages = useWatch({ control, name: 'hasDamages' })
  const actions = useItemAction()
  const finishes = FINISHES_REGISTRATION.includes(item.status)
  const pending = actions.update.isPending || actions.submit.isPending
  const failure = actions.update.error ?? actions.submit.error
  const general = failure ? toFormFailure(failure, 'edit').general : undefined

  const { asking, requestClose, confirmDiscard, keepEditing } = useDiscardGuard(isDirty, onClose)

  function fail(error: unknown) {
    for (const [path, message] of Object.entries(toFormFailure(error, 'edit').fields)) setError(path as 'name', { message })
  }

  const submit = handleSubmit((values) => {
    const body = toUpdateRequest(toEditValues(item), values)
    const changed = Object.keys(body).length > 0
    if (!changed && !finishes) { onClose(); return }
    const finish = () => actions.submit.mutate(item.id, {
      onSuccess: () => onSaved('Cadastro concluído: o item está no estoque.'),
      onError: fail,
    })
    if (!changed) { finish(); return }
    actions.update.mutate({ id: item.id, body }, { onSuccess: () => (finishes ? finish() : onSaved('Item atualizado.')), onError: fail })
  })

  return (
    <>
      <Dialog open title={`Editar item${item.displayCode ? ` ${item.displayCode}` : ''}`} tone="navy" width={44} onClose={requestClose}>
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
