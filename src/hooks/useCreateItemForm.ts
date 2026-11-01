import { useState } from 'react'
import { useForm,useWatch } from 'react-hook-form'
import type { CreateItemDialogProps } from '../types/componentes/CreateItemDialog'
import type { CreateItemInput,CreateItemValues } from '../types/item'
import { toFormFailure } from '../utils/itemFormErrors'
import { toCreateRequest } from '../utils/itemRequests'
import { createItemSchema } from '../utils/itemValidation'
import { resolverFor } from '../utils/validation'
import { useDiscardGuard } from './useDiscardGuard'
import { useCreateItem } from './useItemMutations'
import { useCategories,useModelOptions } from './useItemQueries'

const defaults: CreateItemInput = {
  barcode: '', modelMode: 'existing', modelId: '', model: { name: '', manufacturer: '', categoryId: '', materials: [], estimatedWeightKg: '' },
  name: '', condition: '' as never, hasDamages: '' as never, damages: [], usageIntensity: '', serialNumber: '', acquiredAt: '', manufacturingYear: '', notes: '',
}

export function useCreateItemForm({ onClose, onCreated, onDraft }: CreateItemDialogProps) {
  // One id per opened form: a resend after a timeout reaches the server as the same item (idempotent create).
  const [itemId] = useState(() => crypto.randomUUID())
  const { register, handleSubmit, control, setError, formState: { errors, isDirty } } = useForm<CreateItemInput, unknown, CreateItemValues>({
    resolver: resolverFor(createItemSchema), defaultValues: defaults,
  })
  const [modelMode, hasDamages] = useWatch({ control, name: ['modelMode', 'hasDamages'] })
  const models = useModelOptions()
  const categories = useCategories()
  const create = useCreateItem()
  const general = create.error ? toFormFailure(create.error, 'create').general : undefined

  const { asking, requestClose, confirmDiscard, keepEditing } = useDiscardGuard(isDirty, onClose)

  const submit = handleSubmit((values) => {
    create.mutate(toCreateRequest(values, itemId), {
      onSuccess: (result) => {
        if (result.submitted) onCreated('Item cadastrado e incluído no estoque.')
        else onDraft(result.item, result.missingFields)
      },
      onError: (error) => {
        const failure = toFormFailure(error, 'create')
        for (const [path, message] of Object.entries(failure.fields)) setError(path as 'barcode', { message })
      },
    })
  })

  const modelErrors = errors.model
  const total = models.data?.totalElements ?? 0
  const shown = models.data?.content.length ?? 0

  return { register, errors, modelMode, hasDamages, models, categories, create, general, asking, requestClose, confirmDiscard, keepEditing, submit, modelErrors, total, shown }
}
