import styles from '../../../styles/pages/SettingsPage/SettingsPage.module.css'
import { useCapacityForm } from '../../hooks/useCapacityForm'
import type { CapacityFormProps } from '../../types/componentes/CapacityForm'
import { describeApiError } from '../../utils/apiError'
import { Button } from '../Button'
import { TextField } from '../TextField'

export function CapacityForm({ settings, notify }: CapacityFormProps) {
  const { register, errors, save, submit } = useCapacityForm({ settings, notify })

  return (
    <form className={styles.settingForm} onSubmit={submit} noValidate>
      {save.isError && <p role="alert" className={styles.formAlertLight}>{describeApiError(save.error)}</p>}
      <TextField label="Capacidade (itens)" required type="number" min={0} step={1} inputMode="numeric" error={errors.stockCapacity?.message}
        hint="Número máximo de itens que a unidade comporta. Usado para calcular a ocupação do estoque." {...register('stockCapacity')} />
      <div><Button type="submit" disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar'}</Button></div>
    </form>
  )
}
