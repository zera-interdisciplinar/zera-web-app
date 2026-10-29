import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '../../../components/Button'
import { EstadoErro } from '../../../components/EstadoErro'
import { PageHeader } from '../../../components/PageHeader'
import { Skeleton } from '../../../components/Skeleton'
import { Toast } from '../../../components/Toast'
import { useToast } from '../../../hooks/useToast'
import { describeApiError } from '../../../shared/api/errors'
import { formatDateTime } from '../../../shared/format'
import { TextField } from '../../../shared/ui/fields'
import styles from '../../models/components/Models.module.css'
import { useSaveUnitSettings, useUnitSettings } from '../hooks/useUnitSettings'
import { settingsFormSchema, type SettingsFormInput, type SettingsFormValues, type UnitSettings } from '../schemas/settings'

function CapacityForm({ settings, notify }: { settings: UnitSettings; notify: (message: string) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<SettingsFormInput, unknown, SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema), defaultValues: { stockCapacity: settings.stockCapacity ?? '' },
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

export default function SettingsPage() {
  const settings = useUnitSettings()
  const [toast, notify] = useToast()
  const data = settings.data
  // null means "not configured", never zero (BR-18).
  const configured = data?.stockCapacity != null

  return (
    <div className={styles.page}>
      <PageHeader titulo="Configurações" subtitulo="Parâmetros da unidade." />
      <section className={`${styles.card} ${styles.setting}`} aria-labelledby="capacity-title">
        <h2 id="capacity-title" className={styles.cardTitle}>Capacidade do estoque</h2>
        <div style={{ padding: '0 1.5rem 1rem' }}>
          {settings.isPending && <Skeleton descricao="Carregando configurações…" linhas={2} />}
          {settings.isError && !data && <EstadoErro mensagem={describeApiError(settings.error)} aoTentarNovamente={() => void settings.refetch()} />}
          {data && (
            <>
              <p className={styles.settingValue}>{configured ? data.stockCapacity : 'Não configurada'}</p>
              <p className={styles.settingMeta}>
                {configured
                  ? (data.updatedAt ? `Última alteração em ${formatDateTime(data.updatedAt)}${data.updatedByName ? ` por ${data.updatedByName}` : ''}.` : '')
                  : 'Sem a capacidade, a ocupação do estoque e a regra de alerta “Estoque cheio” ficam inativas.'}
              </p>
              <CapacityForm key={data.stockCapacity ?? 'none'} settings={data} notify={notify} />
            </>
          )}
        </div>
      </section>
      <Toast mensagem={toast} />
    </div>
  )
}
