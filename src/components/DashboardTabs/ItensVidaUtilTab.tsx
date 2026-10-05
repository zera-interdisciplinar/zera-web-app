import { SeloDemonstracao } from './SeloDemonstracao'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from '../../../styles/components/DashboardTabs/ItensVidaUtilTab.module.css'

export function ItensVidaUtilTab({ demo = false }: { demo?: boolean; filtros?: FiltrosDashboard } = {}) {
  return (
    <section className={estilos.sourceState} aria-labelledby="fonte-vida-util">
      <h2 id="fonte-vida-util">Itens e vida útil</h2>
      {demo && <SeloDemonstracao />}
      <p>Ainda não há dados para exibir aqui.</p>
    </section>
  )
}
