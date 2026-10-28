import { SeloDemonstracao } from './SeloDemonstracao'
import type { DashboardSnapshot, FiltrosDashboard } from '../../types/dashboardAnalytics'
import { DataTable } from '../DataTable'
import estilos from '../../../styles/components/DashboardTabs/EvolucaoMovimentacoesTab.module.css'

export function EvolucaoMovimentacoesTab({ demo = false, snapshot = null }: { demo?: boolean; filtros?: FiltrosDashboard; snapshot?: DashboardSnapshot | null } = {}) {
  return (
    <section className={estilos.sourceState} aria-labelledby="fonte-evolucao">
      <h2 id="fonte-evolucao">Evolução e movimentações</h2>
      {demo && <SeloDemonstracao />}
      {snapshot && snapshot.itens_por_mes.length > 0 ? <DataTable
        legenda="Cadastros e encaminhamentos por mês" dados={snapshot.itens_por_mes} chave={(ponto) => ponto.mes}
        colunas={[
          { titulo: 'Mês', render: (ponto) => ponto.mes },
          { titulo: 'Cadastrados', numerica: true, render: (ponto) => ponto.cadastrados },
          { titulo: 'Encaminhados', numerica: true, render: (ponto) => ponto.encaminhados },
        ]}
      /> : <p>Ainda não há dados para exibir aqui.</p>}
      <p>O histórico detalhado de eventos e movimentações ainda não está disponível.</p>
    </section>
  )
}
