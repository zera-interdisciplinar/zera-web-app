import { useForm } from 'react-hook-form'
import { describeApiError } from '../../utils/apiError'
import { useSaveUnitSettings } from '../../hooks/useUnitSettings'
import { settingsFormSchema } from '../../utils/settingsValidation'
import styles from '../../../styles/pages/SettingsPage/SettingsPage.module.css'
import type { CapacityFormProps } from '../../types/componentes/CapacityForm'
import type { SettingsFormInput, SettingsFormValues } from '../../types/settings'
import { Button } from '../Button'
import { TextField } from '../TextField'
import { resolverFor } from '../../utils/validation'

export function CapacityForm({ settings, notify }: CapacityFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: resolverFor(settingsFormSchema), defaultValues: { stockCapacity: settings.stockCapacity ?? '' },
  })
  const save = useSaveUnitSettings()
  const submit = handleSubmit(({ stockCapacity }) => save.mutate(stockCapacity, { onSuccess: () => notify('Capacidade do estoque salva.') }))
  return (
    <form className={styles.settingForm} onSubmit={submit} noValidate>
      {save.isError && <p role="alert" className={styles.formAlertLight}>{describeApiError(save.error)}</p>}
      <TextField label="Capacidade (itens)" required type="number" min={0} step={1} inputMode="numeric" error={errors.stockCapacity?.message}
        hint="Número máximo de itens que a unidade comporta. Usado para calcular a ocupação do estoque." {...register('stockCapacity')} />
      <div><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar'}</Button></div>
    </form>
  )
}
