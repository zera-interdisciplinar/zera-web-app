import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '../../../components/Button'
import { Dialog } from '../../../shared/ui/Dialog'
import { useItemAction } from '../hooks/mutations'
import { toEditInput, toEditValues } from '../model/editValues'
import { toFormFailure } from '../model/formErrors'
import { fieldLabel } from '../model/labels'
import { toUpdateRequest } from '../model/requests'
import { editItemSchema, type EditItemInput, type EditItemValues } from '../schemas/forms'
import type { ItemResponse } from '../schemas/item'
import { ItemFields, type ItemFieldErrors } from './ItemFields'
import styles from './Items.module.css'

interface Props {
  item: ItemResponse
  /** Fields the server said were missing when a draft could not be submitted (BR-10). */
  missingFields?: string[]
  onClose: () => void
  onSaved: (message: string) => void
}

/** Drafts and rejected items finish their registration from here: save, then submit (BR-10). */
const FINISHES_REGISTRATION = ['DRAFT', 'REJECTED']

export function EditItemDialog({ item, missingFields = [], onClose, onSaved }: Props) {
  const { register, handleSubmit, control, setValue, setError, formState: { errors, isDirty } } = useForm<EditItemInput, unknown, EditItemValues>({
    resolver: zodResolver(editItemSchema), defaultValues: toEditInput(item),
  })
  const hasDamages = useWatch({ control, name: 'hasDamages' })
  const actions = useItemAction()
  const finishes = FINISHES_REGISTRATION.includes(item.status)
  const pending = actions.update.isPending || actions.submit.isPending
  const failure = actions.update.error ?? actions.submit.error
  const general = failure ? toFormFailure(failure, 'edit').general : undefined

  function requestClose() {
    if (!isDirty || window.confirm('Descartar as alterações?')) onClose()
  }

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
  )
}
