import { useState } from 'react'
import { OperacionalTab } from '../../components/DashboardTabs/OperacionalTab'
import { PageHeader } from '../../components/PageHeader'
import { EvolucaoMovimentacoesTab } from '../../components/DashboardTabs/EvolucaoMovimentacoesTab'
import { ItensVidaUtilTab } from '../../components/DashboardTabs/ItensVidaUtilTab'
import { MateriaisSustentabilidadeTab } from '../../components/DashboardTabs/MateriaisSustentabilidadeTab'
import { QualidadeDadosTab } from '../../components/DashboardTabs/QualidadeDadosTab'
import { VisaoGeralTab } from '../../components/DashboardTabs/VisaoGeralTab'
import { useDashboardSse } from '../../hooks/useDashboardSse'
import { formatarErroDashboard } from '../../utils/formatarDashboard'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from '../../../styles/pages/DashboardPage/DashboardPage.module.css'

const abas = [
  { id: 'operational', nome: 'Inventário em operação' },
  { id: 'overview', nome: 'Visão geral' },
  { id: 'life', nome: 'Itens e vida útil' },
  { id: 'evolution', nome: 'Evolução e movimentações' },
  { id: 'quality', nome: 'Qualidade dos dados e alertas' },
  { id: 'materials', nome: 'Materiais e sustentabilidade' },
] as const

type AbaId = (typeof abas)[number]['id']
type FiltroKey = keyof FiltrosDashboard
interface OpcaoFiltro { value: string; label: string }
interface DefinicaoFiltro { key: FiltroKey; label: string; options: OpcaoFiltro[] }

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: 'Aguardando aprovação',
  DISCARDED: 'Descartado',
  ACTIVE: 'Em estoque',
  IN_MAINTENANCE: 'Em manutenção',
  REUSED: 'Reuso',
  REMOVED: 'Removido',
}

function labelConexao(estado: string): string {
  const labels: Record<string, string> = {
    connecting: 'Conectando ao dashboard',
    connected: 'API disponível',
    reconnecting: 'Reconectando ao dashboard',
    unavailable: 'API indisponível',
    error: 'API indisponível',
  }
  return labels[estado] ?? estado
}

export default function DashboardPage() {
  const [aba, setAba] = useState<AbaId>('operational')
  const [filtros, setFiltros] = useState<FiltrosDashboard>({ period: '6m', view: 'todos' })
  const { snapshot, estado, indisponivel, erro } = useDashboardSse(filtros, aba !== 'operational')

  const categorias = snapshot?.available_filters.categories ?? []
  const status = snapshot?.available_filters.statuses ?? []
  const unidades = snapshot?.available_filters.units ?? []

  const opcoesStatus = status.map((value) => ({ value, label: statusLabels[value] ?? value }))
  const opcoesCategoria = categorias.map((value) => ({ value, label: value }))
  const opcoesUnidade = unidades.map((unidade) => ({ value: unidade.id, label: unidade.name }))
  const opcoesResponsavel = snapshot?.available_filters.responsibles.map(({ id, name }) => ({ value: id, label: name })) ?? []

  const filtrosPorAba: Record<AbaId, DefinicaoFiltro[]> = {
    operational: [],
    overview: [
      { key: 'period', label: 'Período', options: ['30d', '6m', '12m'].map((value) => ({ value, label: value })) },
      { key: 'view', label: 'Visão', options: ['todos', 'pendentes', 'categoria'].map((value) => ({ value, label: value })) },
      { key: 'status', label: 'Situação', options: opcoesStatus },
      { key: 'category', label: 'Categoria', options: opcoesCategoria },
      { key: 'unitId', label: 'Unidade', options: opcoesUnidade },
      { key: 'responsible', label: 'Responsável', options: opcoesResponsavel },
    ],
    life: [],
    evolution: [],
    quality: [],
    materials: [],
  }

  const alterarFiltro = (key: FiltroKey, value: string) => {
    setFiltros((atuais) => {
      const atualizados = { ...atuais, [key]: value || undefined } as FiltrosDashboard
      if (key === 'period') {
        atualizados.period = (value || '6m') as FiltrosDashboard['period']
        atualizados.from = undefined
        atualizados.to = undefined
      }
      return atualizados
    })
  }

  return (
    <div className={estilos.dashboard} data-estado={aba === 'operational' ? undefined : erro || indisponivel ? 'erro' : snapshot ? 'sucesso' : 'carregando'}>
      <div className={estilos.tituloLinha}>
        <PageHeader titulo="Dashs do Zera" subtitulo="Indicadores de inventário, movimentações e sustentabilidade." />
        <span className={`${estilos.estado} ${estilos[`estado_${estado}`]}`} role="status" aria-live="polite">
          {aba === 'operational' ? 'API de inventário' : labelConexao(estado)}
        </span>
      </div>

      {aba !== 'operational' && snapshot && (
        <p className={estilos.mensagemInfo} role="status">
          Dados de analytics · {snapshot.organization.name} · Extraído em {snapshot.extracted_at}
          {estado === 'reconnecting' ? ' · Reconectando: exibindo o último lote recebido.' : ''}
        </p>
      )}

      <nav className={estilos.abas} role="tablist" aria-label="Dashboards do Zera">
        {abas.map((item) => (
          <button
            key={item.id}
            id={`aba-${item.id}`}
            className={`${estilos.aba} ${aba === item.id ? estilos.abaAtiva : ''}`}
            role="tab"
            type="button"
            aria-selected={aba === item.id}
            aria-controls={`painel-${item.id}`}
            tabIndex={aba === item.id ? 0 : -1}
            onClick={() => setAba(item.id)}
            onKeyDown={(evento) => {
              const indice = abas.findIndex((opcao) => opcao.id === item.id)
              const destino = evento.key === 'ArrowRight' ? (indice + 1) % abas.length
                : evento.key === 'ArrowLeft' ? (indice + abas.length - 1) % abas.length
                  : evento.key === 'Home' ? 0 : evento.key === 'End' ? abas.length - 1 : -1
              if (destino < 0) return
              evento.preventDefault()
              setAba(abas[destino].id)
              document.getElementById(`aba-${abas[destino].id}`)?.focus()
            }}
          >
            {item.nome}
          </button>
        ))}
      </nav>

      <section className={estilos.filtros} aria-label="Filtros do dashboard">
        {filtrosPorAba[aba].map((definicao) => (
          <label className={estilos.filtro} key={definicao.key}>
            <span>{definicao.label}</span>
            <select
              value={String(filtros[definicao.key] ?? '')}
              onChange={(evento) => alterarFiltro(definicao.key, evento.target.value)}
              aria-label={definicao.label}
            >
              {!['period', 'view'].includes(definicao.key) && <option value="">Todos</option>}
              {definicao.options.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
            </select>
          </label>
        ))}
      </section>

      {aba !== 'operational' && erro && <p className={estilos.mensagemErro} role="alert">{formatarErroDashboard(erro.status, erro.detail)}</p>}
      {aba !== 'operational' && indisponivel && <p className={estilos.mensagemInfo} role="status">Ainda não há lote de analytics para esta unidade. {indisponivel}</p>}

      <div id={`painel-${aba}`} role="tabpanel" aria-labelledby={`aba-${aba}`} className={estilos.painel}>
        {aba === 'operational' && <OperacionalTab />}
        {aba === 'overview' && <VisaoGeralTab snapshot={snapshot} />}
        {aba === 'life' && <ItensVidaUtilTab />}
        {aba === 'evolution' && <EvolucaoMovimentacoesTab />}
        {aba === 'quality' && <QualidadeDadosTab />}
        {aba === 'materials' && <MateriaisSustentabilidadeTab />}
      </div>
    </div>
  )
}
