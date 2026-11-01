import { useForm } from 'react-hook-form'
import type { ModelDialogProps } from '../types/componentes/ModelDialog'
import type { Model } from '../types/item'
import type { ModelFormInput,ModelFormValues } from '../types/model'
import { toCreateModelRequest,toModelPatches } from '../utils/modelRequests'
import { modelFormSchema } from '../utils/modelValidation'
import { resolverFor } from '../utils/validation'
import { useDiscardGuard } from './useDiscardGuard'
import { useCategories } from './useItemQueries'
import { useModelActions } from './useModelMutations'

function defaultsFor(model?: Model): ModelFormInput {
  return {
    name: model?.name ?? '', manufacturer: model?.manufacturer ?? '', categoryId: model?.category.id ?? '',
    materials: model?.materials.map((material) => material.code) ?? [], estimatedWeightKg: model?.estimatedWeightKg ?? '',
    warrantyMonths: model?.warrantyMonths ?? '', expectedLifespanMonths: model?.expectedLifespanMonths ?? '', notes: model?.notes ?? '',
  }
}

export function useModelForm({ model, onClose, onDone }: ModelDialogProps) {
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ModelFormInput, unknown, ModelFormValues>({ resolver: resolverFor(modelFormSchema), defaultValues: defaultsFor(model) })
  const categories = useCategories()
  const actions = useModelActions()
  const pending = actions.create.isPending || actions.edit.isPending
  const failure = actions.create.error ?? actions.edit.error

  const { asking, requestClose, confirmDiscard, keepEditing } = useDiscardGuard(isDirty, onClose)

  const submit = handleSubmit((values) => {
    if (!model) {
      actions.create.mutate(toCreateModelRequest(values), { onSuccess: () => onDone('Modelo cadastrado.') })
      return
    }
    const patches = toModelPatches(model, values)
    if (patches.length === 0) { onClose(); return }
    actions.edit.mutate({ id: model.id, patches }, { onSuccess: () => onDone('Modelo atualizado.') })
  })

  return { register, errors, categories, pending, failure, asking, requestClose, confirmDiscard, keepEditing, submit }
}
