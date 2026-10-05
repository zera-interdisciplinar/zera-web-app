import { SeloDemonstracao } from './SeloDemonstracao'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from '../../../styles/components/DashboardTabs/EvolucaoMovimentacoesTab.module.css'

export function EvolucaoMovimentacoesTab({ demo = false }: { demo?: boolean; filtros?: FiltrosDashboard } = {}) {
  return (
    <section className={estilos.sourceState} aria-labelledby="fonte-evolucao">
      <h2 id="fonte-evolucao">Evolução e movimentações</h2>
      {demo && <SeloDemonstracao />}
      <p>Ainda não há dados para exibir aqui.</p>
    </section>
  )
}
