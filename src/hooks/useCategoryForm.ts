import { useForm } from 'react-hook-form'
import type { CategoryDialogProps } from '../types/componentes/CategoryDialog'
import type { CategoryFormInput,CategoryFormValues } from '../types/model'
import { categoryFormSchema } from '../utils/modelValidation'
import { resolverFor } from '../utils/validation'
import { useDiscardGuard } from './useDiscardGuard'
import { useCategoryActions } from './useModelMutations'



export function useCategoryForm({ category, onClose, onDone }: CategoryDialogProps) {
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

  return { register, errors, pending, failure, asking, requestClose, confirmDiscard, keepEditing, submit }
}
