import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '../../../components/Button'
import { describeApiError } from '../../../shared/api/errors'
import { Dialog } from '../../../shared/ui/Dialog'
import { TextAreaField, TextField } from '../../../shared/ui/fields'
import type { z } from 'zod'
import type { categorySchema } from '../../items/schemas/item'
import { useCategoryActions } from '../hooks/mutations'
import { categoryFormSchema, type CategoryFormInput, type CategoryFormValues } from '../schemas/forms'
import styles from './Models.module.css'

interface Props {
  category?: z.infer<typeof categorySchema>
  onClose: () => void
  onDone: (message: string) => void
}

export function CategoryDialog({ category, onClose, onDone }: Props) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<CategoryFormInput, unknown, CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema), defaultValues: { name: category?.name ?? '', description: category?.description ?? '' },
  })
  const actions = useCategoryActions()
  const pending = actions.create.isPending || actions.edit.isPending
  const failure = actions.create.error ?? actions.edit.error

  function requestClose() {
    if (!isDirty || window.confirm('Descartar as alterações?')) onClose()
  }

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
  )
}
