import estilos from '../../../styles/pages/DashboardPage/DashboardPage.module.css'
import { usePainelGestao } from '../../hooks/usePainelGestao'
import type { PainelGestaoProps } from '../../types/componentes/PainelGestao'
import { formatarDataRelativa } from '../../utils/formatacao'
import { formatarErroDashboard } from '../../utils/formatarDashboard'
import { EvolucaoMovimentacoesTab } from '../DashboardTabs/EvolucaoMovimentacoesTab'
import { ItensVidaUtilTab } from '../DashboardTabs/ItensVidaUtilTab'
import { MateriaisSustentabilidadeTab } from '../DashboardTabs/MateriaisSustentabilidadeTab'
import { OperacionalTab } from '../DashboardTabs/OperacionalTab'
import { QualidadeDadosTab } from '../DashboardTabs/QualidadeDadosTab'
import { VisaoGeralTab } from '../DashboardTabs/VisaoGeralTab'
import { DistribuicaoInventario } from '../DistribuicaoInventario'
import { CadastrosInventario } from '../CadastrosInventario'
import { EstadoErro } from '../EstadoErro'
import { PageHeader } from '../PageHeader'
const abas = [
  { id: 'operational', nome: 'Inventário em operação' },
  { id: 'overview', nome: 'Visão geral' },
  { id: 'life', nome: 'Itens e vida útil' },
  { id: 'evolution', nome: 'Evolução e movimentações' },
  { id: 'quality', nome: 'Qualidade dos dados e alertas' },
  { id: 'materials', nome: 'Materiais e sustentabilidade' },
] as const
function labelConexao(estado: string): string {
  const labels: Record<string, string> = {
    connecting: 'Preparando os dados…',
    connected: 'Dados atualizados',
    reconnecting: 'Preparando os dados…',
    unavailable: 'Dados indisponíveis',
    error: 'Dados indisponíveis',
  }
  return labels[estado] ?? estado
}

export function PainelGestao({ pessoal = false }: PainelGestaoProps) {
  const { aba, setAba, filtros, usaStream, snapshot, estado, indisponivel, erro, recarregar, filtrosPorAba, alterarFiltro } = usePainelGestao()

  return (
    <div className={estilos.dashboard} data-estado={usaStream ? erro ? 'erro' : indisponivel ? 'indisponivel' : snapshot ? 'sucesso' : 'carregando' : undefined}>
      <div className={estilos.tituloLinha}>
        <PageHeader titulo={pessoal ? 'Indicadores da unidade' : 'Painel do Zera'} subtitulo="Indicadores de inventário, movimentações e sustentabilidade." />
        <span className={`${estilos.estado} ${estilos[`estado_${estado}`]}`} role="status" aria-live="polite">
          {!usaStream ? 'Inventário da unidade' : labelConexao(estado)}
        </span>
      </div>

      {usaStream && snapshot && (
        <p className={estilos.mensagemInfo} role="status">
          Atualização: {formatarDataRelativa(snapshot.extracted_at)}
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
        {filtrosPorAba[aba].filter(definicao => !pessoal || !['unitId', 'responsible'].includes(definicao.key)).map((definicao) => (
          <label className={estilos.filtro} key={definicao.key} htmlFor={`filtro-painel-${definicao.key}`}>
            <span>{definicao.label}</span>
            <select
              id={`filtro-painel-${definicao.key}`}
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

      {usaStream && erro && <EstadoErro mensagem={formatarErroDashboard(erro.status, erro.detail)} aoTentarNovamente={recarregar} />}
      {usaStream && indisponivel && <p className={estilos.mensagemInfo} role="status">Os dados deste período ainda não foram disponibilizados.</p>}

      <div id={`painel-${aba}`} role="tabpanel" aria-labelledby={`aba-${aba}`} className={estilos.painel}>
        {aba === 'operational' && <OperacionalTab />}
        {aba === 'overview' && <><OperacionalTab /><DistribuicaoInventario /><VisaoGeralTab snapshot={snapshot} aguardando={!erro && !indisponivel} /></>}
        {aba === 'life' && <ItensVidaUtilTab ativo />}
        {aba === 'evolution' && <><CadastrosInventario /><EvolucaoMovimentacoesTab snapshot={snapshot} aguardando={!erro && !indisponivel} /></>}
        {aba === 'quality' && <QualidadeDadosTab snapshot={snapshot} aguardando={!erro && !indisponivel} />}
        {aba === 'materials' && <MateriaisSustentabilidadeTab ativo />}
      </div>
    </div>
  )
}
