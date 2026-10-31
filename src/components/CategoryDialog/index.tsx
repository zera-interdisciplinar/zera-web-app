import { useForm } from 'react-hook-form'
import { Button } from '../Button'
import { describeApiError } from '../../utils/apiError'
import { Dialog } from '../Dialog'
import { TextAreaField } from '../TextAreaField'
import { TextField } from '../TextField'
import { useCategoryActions } from '../../hooks/useModelMutations'
import { categoryFormSchema } from '../../utils/modelValidation'
import styles from '../../../styles/components/Models/Models.module.css'
import type { CategoryDialogProps } from '../../types/componentes/CategoryDialog'
import type { CategoryFormInput, CategoryFormValues } from '../../types/model'
import { resolverFor } from '../../utils/validation'
import { useDiscardGuard } from '../../hooks/useDiscardGuard'
import { ConfirmDialog } from '../ConfirmDialog'

export function CategoryDialog({ category, onClose, onDone }: CategoryDialogProps) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: resolverFor(categoryFormSchema), defaultValues: { name: category?.name ?? '', description: category?.description ?? '' },
  })
  const actions = useCategoryActions()
  const pending = actions.create.isPending || actions.edit.isPending
  const failure = actions.create.error ?? actions.edit.error

  const { asking, requestClose, confirmDiscard, keepEditing } = useDiscardGuard(isDirty, onClose)

  const submit = handleSubmit((values) => {
    if (!category) {
      actions.create.mutate(values, { onSuccess: () => onDone('Categoria criada.') })
      return
    }
    const changes = { name: values.name !== category.name ? values.name : undefined, description: values.description !== (category.description ?? '') ? values.description : undefined }
    if (changes.name === undefined && changes.description === undefined) { onClose(); return }
    actions.edit.mutate({ id: category.id, ...changes }, { onSuccess: () => onDone('Categoria atualizada.') })
  })

  return (
    <>
      <Dialog open title={category ? 'Editar categoria' : 'Nova categoria'} tone="navy" width={32} onClose={requestClose}>
        <form className={styles.form} onSubmit={submit} noValidate>
          {failure && <p role="alert" className={styles.formAlert}>{describeApiError(failure)}</p>}
          <TextField tone="navy" label="Nome" required maxLength={120} error={errors.name?.message} {...register('name')} />
          <TextAreaField tone="navy" label="Descrição" required maxLength={500} error={errors.description?.message} {...register('description')} />
          <div className={styles.actions}>
            <Button variante="secundario" onClick={requestClose}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : category ? 'Salvar alterações' : 'Criar categoria'}</Button>
          </div>
        </form>
      </Dialog>
      {asking && <ConfirmDialog title="Descartar alterações?" message="Descartar as alterações? O que foi digitado será perdido." confirmLabel="Descartar" cancelLabel="Continuar editando" onConfirm={confirmDiscard} onCancel={keepEditing} />}
    </>
  )
}
