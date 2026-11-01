import { Archive, Leaf, Recycle, TriangleAlert } from 'lucide-react'
import { EstadoErro } from '../../components/EstadoErro'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/Skeleton'
import { describeApiError } from '../../utils/apiError'
import { formatDateTime } from '../../utils/format'
import { CircularityDonut } from '../../components/CircularityDonut'
import { ConnectionBadge } from '../../components/ConnectionBadge'
import { Distribution } from '../../components/Distribution'
import { FilterPanel } from '../../components/FilterPanel'
import { KpiCard } from '../../components/KpiCard'
import { MonthlyBars } from '../../components/MonthlyBars'
import styles from '../../../styles/components/Dashboard/Dashboard.module.css'
import { dashboardCopy } from '../../utils/dashboardCopy'
import { useDashboardFilters } from '../../hooks/useDashboardFilters'
import { useOverviewStream } from '../../hooks/useOverviewStream'
import { formatCount, formatImpact, formatPercent, formatRelativeTime, formatSignedPercent, formatSignedPoints } from '../../utils/dashboardFormat'
import { PERIOD_LABELS, severityLabel, statusLabel } from '../../utils/dashboardLabels'

/** Only show a comparison when one is available; missing data is never displayed as zero. */
function change(text: string, value: number | null, suffix: string) {
  return value === null ? null : `${text} ${suffix}`
}

export default function OverviewPage() {
  const { filters, problems, apply, clear } = useDashboardFilters()
  const stream = useOverviewStream(filters)
  const snapshot = stream.snapshot

  const impact = snapshot ? formatImpact(snapshot.kpis.impacto_recuperado.kg, snapshot.kpis.impacto_recuperado.tonnes) : null
  const range = snapshot ? (snapshot.applied_filters.date_from && snapshot.applied_filters.date_to ? `${snapshot.applied_filters.date_from} a ${snapshot.applied_filters.date_to}` : PERIOD_LABELS[snapshot.applied_filters.period]) : ''

  return (
    <div className={styles.page} data-state={stream.status}>
      <div className={styles.header}>
        <PageHeader titulo={dashboardCopy.title} subtitulo={dashboardCopy.subtitle} />
        <div className={styles.freshness}>
          <ConnectionBadge status={stream.status} />
          {snapshot && <span className={styles.updated}>Dados do lote de {formatDateTime(snapshot.extracted_at)}</span>}
        </div>
      </div>

      <FilterPanel filters={filters} available={snapshot?.available_filters} problems={problems} onApply={apply} onClear={clear} />

      {stream.error && <EstadoErro mensagem={describeApiError(stream.error)} aoTentarNovamente={stream.reconnect} />}
      {stream.status === 'connecting' && !stream.error && <Skeleton descricao="Preparando os dados…" linhas={4} />}
      {stream.status === 'unavailable' && <p role="status" className={styles.notice}>{dashboardCopy.unavailable}</p>}
      {stream.status === 'reconnecting' && snapshot && <p role="status" className={styles.notice}>Reconectando: exibindo o último lote recebido.</p>}

      {snapshot && impact && (
        <>
          <section className={styles.kpis} aria-label="Indicadores gerais">
            <KpiCard title="Itens cadastrados" value={formatCount(snapshot.kpis.itens_cadastrados.value)} icon={<Archive />} iconTone="navy"
              note={change(formatSignedPercent(snapshot.kpis.itens_cadastrados.change_percent), snapshot.kpis.itens_cadastrados.change_percent, 'no período')} />
            <KpiCard title="Taxa de reciclagem" value={formatPercent(snapshot.kpis.taxa_reciclagem.percent, 2, true)} icon={<Recycle />} iconTone="green"
              note={change(formatSignedPoints(snapshot.kpis.taxa_reciclagem.change_points, 2, true), snapshot.kpis.taxa_reciclagem.change_points, 'no período')} noteTone="green" />
            <KpiCard title="Aguardando aprovação" value={formatCount(snapshot.kpis.aguardando_aprovacao.value)} icon={<TriangleAlert />} iconTone="amber" />
            <KpiCard title="Materiais recuperados" value={impact.value} icon={<Leaf />} iconTone="navy" note={`Equivalente a ${impact.detail}`} />
          </section>

          <div className={styles.charts}>
            <MonthlyBars points={snapshot.itens_por_mes} rangeLabel={range} />
            <CircularityDonut percent={snapshot.circularidade.percent} />
          </div>

          <section className={`${styles.card} ${styles.breakdown}`} aria-labelledby="breakdown-title">
            <h2 id="breakdown-title" className={styles.cardTitle}>Distribuição do inventário</h2>
            <p className={styles.cardSubtitle}>Atualizado {formatRelativeTime(snapshot.extracted_at)}</p>
            <div className={styles.distributions}>
              <Distribution title="Por categoria" emptyText="Nenhum item por categoria neste período." rows={snapshot.por_categoria.map((row) => ({ key: row.nome, label: row.nome, quantity: row.quantidade, percent: row.percentual }))} />
              <Distribution title="Por situação" emptyText="Nenhum item por situação neste período." rows={snapshot.por_status.map((row) => ({ key: row.nome, label: statusLabel(row.nome), quantity: row.quantidade, percent: row.percentual }))} />
              <Distribution title={`Alertas abertos (${formatCount(snapshot.alertas.abertos)})`} emptyText="Nenhum alerta aberto neste período." rows={snapshot.alertas.por_gravidade.map((row) => ({ key: row.gravidade, label: severityLabel(row.gravidade), quantity: row.quantidade, percent: null }))} />
            </div>
          </section>
        </>
      )}
    </div>
  )
}
