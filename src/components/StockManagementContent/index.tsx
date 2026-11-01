import { EstadoErro } from '../../components/EstadoErro'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useToast } from '../../hooks/useToast'
import { describeApiError } from '../../utils/apiError'
import { formatDateTime } from '../../utils/format'
import { CapacityOverview } from '../../components/CapacityOverview'
import { CapacityForm } from '../../components/CapacityForm'
import styles from '../../../styles/pages/SettingsPage/SettingsPage.module.css'
import { useUnitSettings } from '../../hooks/useUnitSettings'

export function StockManagementContent() {
  const settings = useUnitSettings()
  const [toast, notify] = useToast()
  const data = settings.data
  // null means "not configured", never zero (BR-18).
  const configured = data?.stockCapacity != null

  return (
    <div className={styles.page}>
      <section aria-labelledby="capacity-title">
        <h2 id="capacity-title" className={styles.cardTitle}>Capacidade do estoque</h2>
        <div className={styles.body}>
          {settings.isPending && <Skeleton descricao="Carregando configurações…" linhas={2} />}
          {settings.isError && !data && <EstadoErro mensagem={describeApiError(settings.error)} aoTentarNovamente={() => void settings.refetch()} />}
          {data && (
            <>
              <CapacityOverview capacity={data.stockCapacity ?? null} />
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
