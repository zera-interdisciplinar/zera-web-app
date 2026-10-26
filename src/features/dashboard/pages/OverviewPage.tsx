import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Archive, Leaf, Recycle, TriangleAlert } from 'lucide-react'
import { EstadoErro } from '../../../components/EstadoErro'
import { PageHeader } from '../../../components/PageHeader'
import { SearchInput } from '../../../components/SearchInput'
import { Skeleton } from '../../../components/Skeleton'
import { describeApiError } from '../../../shared/api/errors'
import { TopbarSlot } from '../../../shared/ui/TopbarSlot'
import { CircularityDonut } from '../components/CircularityDonut'
import { ConnectionBadge } from '../components/ConnectionBadge'
import { Distribution } from '../components/Distribution'
import { FilterPanel } from '../components/FilterPanel'
import { FilterSummary } from '../components/FilterSummary'
import { KpiCard } from '../components/KpiCard'
import { MonthlyBars } from '../components/MonthlyBars'
import styles from '../components/Dashboard.module.css'
import { dashboardCopy } from '../copy'
import { useDashboardFilters } from '../hooks/useDashboardFilters'
import { useOverviewStream } from '../hooks/useOverviewStream'
import { formatCount, formatImpact, formatPercent, formatRelativeTime, formatSignedPercent, formatSignedPoints, NOT_AVAILABLE } from '../model/format'
import { PERIOD_LABELS, severityLabel, statusLabel, VIEW_LABELS } from '../model/labels'
import { VIEWS } from '../schemas/snapshot'

const SEARCH_DELAY_MS = 400

/** A change that could not be computed (null) says so, instead of reading as "0%" (BR-08). */
function change(text: string, value: number | null, suffix: string) {
  return value === null ? <span title="Sem base de comparação" aria-label="Sem base de comparação">{NOT_AVAILABLE}</span> : `${text} ${suffix}`
}

export default function OverviewPage() {
  const { filters, problems, apply, clear } = useDashboardFilters()
  const stream = useOverviewStream(filters)
  const [search, setSearch] = useState(filters.q ?? '')
  const snapshot = stream.snapshot

  useEffect(() => {
    if (search.trim() === (filters.q ?? '')) return
    const timer = window.setTimeout(() => apply({ q: search.trim() || undefined }), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [search, filters.q, apply])

  const impact = snapshot ? formatImpact(snapshot.kpis.impacto_recuperado.kg, snapshot.kpis.impacto_recuperado.tonnes) : null
  const range = snapshot ? (snapshot.applied_filters.date_from && snapshot.applied_filters.date_to ? `${snapshot.applied_filters.date_from} a ${snapshot.applied_filters.date_to}` : PERIOD_LABELS[snapshot.applied_filters.period]) : ''

  return (
    <div className={styles.page} data-state={stream.status}>
      <TopbarSlot><FilterSummary filters={filters} available={snapshot?.available_filters} /></TopbarSlot>
      <div className={styles.header}>
        <PageHeader titulo={dashboardCopy.title} subtitulo={dashboardCopy.subtitle} />
        <ConnectionBadge status={stream.status} />
      </div>

      <div className={styles.toolbar}>
        <SearchInput id="dashboard-search" rotulo={dashboardCopy.searchLabel} valor={search} aoMudar={setSearch} placeholder={dashboardCopy.searchPlaceholder} />
        <div className={styles.chips} role="group" aria-label="Visão">
          {VIEWS.map((view) => (
            <button key={view} type="button" className={styles.chip} aria-pressed={filters.view === view} onClick={() => apply({ view })}>{VIEW_LABELS[view]}</button>
          ))}
        </div>
      </div>

      <FilterPanel filters={filters} available={snapshot?.available_filters} problems={problems} onApply={apply} onClear={() => { setSearch(''); clear() }} />

      {stream.error && <EstadoErro mensagem={describeApiError(stream.error)} aoTentarNovamente={stream.reconnect} />}
      {stream.status === 'connecting' && !stream.error && <Skeleton descricao="Preparando os dados…" linhas={4} />}
      {stream.status === 'unavailable' && <p role="status" className={styles.notice}>{dashboardCopy.unavailable}</p>}
      {stream.status === 'reconnecting' && snapshot && <p role="status" className={styles.notice}>Reconectando: exibindo o último lote recebido.</p>}

      {snapshot && impact && (
        <>
          <section className={styles.kpis} aria-label="Indicadores gerais">
            <KpiCard title="Itens cadastrados" value={formatCount(snapshot.kpis.itens_cadastrados.value)} icon={<Archive />} iconTone="navy"
              note={change(formatSignedPercent(snapshot.kpis.itens_cadastrados.change_percent), snapshot.kpis.itens_cadastrados.change_percent, 'no período')} />
            <KpiCard title="Taxa de reciclagem" value={formatPercent(snapshot.kpis.taxa_reciclagem.percent, 0)} icon={<Recycle />} iconTone="green"
              note={change(formatSignedPoints(snapshot.kpis.taxa_reciclagem.change_points), snapshot.kpis.taxa_reciclagem.change_points, 'no período')} noteTone="green" />
            <KpiCard title="Aguardando aprovação" value={formatCount(snapshot.kpis.aguardando_aprovacao.value)} icon={<TriangleAlert />} iconTone="amber" noteTone="amber"
              note={<Link to="/itens?status=PENDING_APPROVAL">{formatCount(snapshot.kpis.aguardando_aprovacao.prioritarios)} prioritários</Link>} />
            <KpiCard title="Impacto recuperado" value={impact.value} icon={<Leaf />} iconTone="navy" note={`Materiais recuperados · ${impact.detail}`} />
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
