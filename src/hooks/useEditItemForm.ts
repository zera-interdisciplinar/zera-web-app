import { useForm,useWatch } from 'react-hook-form'
import type { EditItemDialogProps } from '../types/componentes/EditItemDialog'
import type { EditItemInput,EditItemValues } from '../types/item'
import { toEditInput,toEditValues } from '../utils/itemEditValues'
import { toFormFailure } from '../utils/itemFormErrors'
import { toUpdateRequest } from '../utils/itemRequests'
import { editItemSchema } from '../utils/itemValidation'
import { resolverFor } from '../utils/validation'
import { useDiscardGuard } from './useDiscardGuard'
import { useItemAction } from './useItemMutations'

/** Drafts and rejected items finish their registration from here: save, then submit (BR-10). */
const FINISHES_REGISTRATION = ['DRAFT', 'REJECTED']

export function useEditItemForm({ item, onClose, onSaved }: EditItemDialogProps) {
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

  return { register, errors, setValue, hasDamages, finishes, pending, general, asking, requestClose, confirmDiscard, keepEditing, submit }
}
