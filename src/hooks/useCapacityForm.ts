import { useForm } from 'react-hook-form'
import type { CapacityFormProps } from '../types/componentes/CapacityForm'
import type { SettingsFormInput,SettingsFormValues } from '../types/settings'
import { settingsFormSchema } from '../utils/settingsValidation'
import { resolverFor } from '../utils/validation'
import { useSaveUnitSettings } from './useUnitSettings'



export function useCapacityForm({ settings, notify }: CapacityFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: resolverFor(settingsFormSchema), defaultValues: { stockCapacity: settings.stockCapacity ?? '' },
  })
  const save = useSaveUnitSettings()
  const submit = handleSubmit(({ stockCapacity }) => save.mutate(stockCapacity, { onSuccess: () => notify('Capacidade do estoque salva.') }))
  return { register, errors, save, submit }
}
