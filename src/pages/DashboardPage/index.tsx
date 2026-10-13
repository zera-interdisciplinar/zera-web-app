import { useState } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { EvolucaoMovimentacoesTab } from '../../components/DashboardTabs/EvolucaoMovimentacoesTab'
import { ItensVidaUtilTab } from '../../components/DashboardTabs/ItensVidaUtilTab'
import { MateriaisSustentabilidadeTab } from '../../components/DashboardTabs/MateriaisSustentabilidadeTab'
import { QualidadeDadosTab } from '../../components/DashboardTabs/QualidadeDadosTab'
import { VisaoGeralTab } from '../../components/DashboardTabs/VisaoGeralTab'
import { useDashboardSse } from '../../hooks/useDashboardSse'
import { modoDemonstracao } from '../../services/apiReal'
import { itensVidaUtilFixture } from '../../mocks/dashboardTabs/itensVidaUtil'
import { evolucaoMovimentacoesFixture } from '../../mocks/dashboardTabs/evolucaoMovimentacoes'
import { qualidadeDadosDemo } from '../../mocks/dashboardTabs/qualidadeDados'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from '../../../styles/pages/DashboardPage/DashboardPage.module.css'

const abas = [
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
    connected: 'Atualizado pelo stream',
    reconnecting: 'Reconectando ao dashboard',
    unavailable: 'Snapshot indisponível',
    error: 'Falha na conexão',
  }
  return labels[estado] ?? estado
}

export default function DashboardPage() {
  const [aba, setAba] = useState<AbaId>('overview')
  const [filtros, setFiltros] = useState<FiltrosDashboard>({ period: '6m', view: 'todos' })
  const { snapshot, estado, indisponivel, erro } = useDashboardSse(filtros)

  const categorias = [...new Set([
    ...(snapshot?.available_filters.categories ?? []),
    ...(modoDemonstracao ? itensVidaUtilFixture.categorias : []),
    ...(modoDemonstracao ? qualidadeDadosDemo.categorias : []),
  ])]
  const status = snapshot?.available_filters.statuses ?? []
  const unidades = [...new Map([
    ...(snapshot?.available_filters.units ?? []),
    ...(modoDemonstracao ? evolucaoMovimentacoesFixture.unidades.map((unidade) => ({ id: unidade.id, name: unidade.nome })) : []),
    ...(modoDemonstracao ? qualidadeDadosDemo.unidades.map((unidade) => ({ id: unidade.id, name: unidade.nome })) : []),
  ].map((unidade) => [unidade.id, unidade])).values()]
  const meses = [...new Set([
    ...(snapshot?.itens_por_mes.map((ponto) => ponto.mes) ?? []),
    ...(modoDemonstracao ? itensVidaUtilFixture.mesesCadastro : []),
  ])]

  const opcoesStatus = status.map((value) => ({ value, label: statusLabels[value] ?? value }))
  const opcoesCategoria = categorias.map((value) => ({ value, label: value }))
  const opcoesUnidade = unidades.map((unidade) => ({ value: unidade.id, label: unidade.name }))
  const opcoesMes = meses.map((value) => ({ value, label: value }))
  const opcoesCondicao = [{ value: 'Novo', label: 'Novo' }, { value: 'Usado', label: 'Usado' }]
  const opcoesSimNao = [{ value: 'Sim', label: 'Sim' }, { value: 'Não', label: 'Não' }]

  const filtrosPorAba: Record<AbaId, DefinicaoFiltro[]> = {
    overview: [
      { key: 'status', label: 'Situação', options: opcoesStatus },
      { key: 'condition', label: 'Condição', options: opcoesCondicao },
      { key: 'category', label: 'Categoria', options: opcoesCategoria },
    ],
    life: [
      { key: 'category', label: 'Categoria', options: opcoesCategoria },
      { key: 'status', label: 'Situação', options: opcoesStatus },
      { key: 'condition', label: 'Condição', options: opcoesCondicao },
      { key: 'registrationMonth', label: 'Mês de cadastro', options: opcoesMes },
    ],
    evolution: [
      { key: 'period', label: 'Período', options: ['30d', '6m', '12m'].map((value) => ({ value, label: value })) },
      { key: 'unitId', label: 'Unidade', options: opcoesUnidade },
    ],
    quality: [
      { key: 'status', label: 'Situação', options: opcoesStatus },
      { key: 'category', label: 'Categoria', options: opcoesCategoria },
      { key: 'unitId', label: 'Unidade', options: opcoesUnidade },
    ],
    materials: [
      { key: 'recyclable', label: 'Material reciclável', options: opcoesSimNao },
      { key: 'hazardous', label: 'Material perigoso', options: opcoesSimNao },
      { key: 'condition', label: 'Condição do item', options: opcoesCondicao },
    ],
  }

  const alterarFiltro = (key: FiltroKey, value: string) => {
    setFiltros((atuais) => {
      const atualizados = { ...atuais, [key]: value || undefined } as FiltrosDashboard
      if (key === 'period') {
        atualizados.period = (value || '6m') as FiltrosDashboard['period']
        atualizados.from = undefined
        atualizados.to = undefined
        atualizados.registrationMonth = undefined
      }
      if (key === 'registrationMonth') {
        if (value) {
          const [ano, mes] = value.split('-').map(Number)
          atualizados.from = `${value}-01`
          atualizados.to = new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10)
        } else {
          atualizados.from = undefined
          atualizados.to = undefined
        }
      }
      return atualizados
    })
  }

  return (
    <div className={estilos.dashboard}>
      <div className={estilos.tituloLinha}>
        <PageHeader titulo="Dashs do Zera" subtitulo="Indicadores de inventário, movimentações e sustentabilidade." />
        <span className={`${estilos.estado} ${estilos[`estado_${estado}`]}`} role="status" aria-live="polite">
          {labelConexao(estado)}
        </span>
      </div>

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
              <option value="">Todos</option>
              {definicao.options.map((opcao) => <option key={opcao.value} value={opcao.value}>{opcao.label}</option>)}
            </select>
          </label>
        ))}
      </section>

      {erro && <p className={estilos.mensagemErro} role="alert">HTTP {erro.status || '—'}: {erro.detail}</p>}
      {indisponivel && !snapshot && <p className={estilos.mensagemInfo} role="status">{indisponivel}</p>}

      <div id={`painel-${aba}`} role="tabpanel" aria-labelledby={`aba-${aba}`} className={estilos.painel}>
        {aba === 'overview' && <VisaoGeralTab snapshot={snapshot} demo={modoDemonstracao} />}
        {aba === 'life' && <ItensVidaUtilTab demo={modoDemonstracao} filtros={filtros} />}
        {aba === 'evolution' && <EvolucaoMovimentacoesTab demo={modoDemonstracao} filtros={filtros} />}
        {aba === 'quality' && <QualidadeDadosTab demo={modoDemonstracao} filtros={filtros} />}
        {aba === 'materials' && <MateriaisSustentabilidadeTab demo={modoDemonstracao} filtros={filtros} />}
      </div>
    </div>
  )
}
