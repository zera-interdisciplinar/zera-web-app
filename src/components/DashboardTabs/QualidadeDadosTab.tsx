import { SeloDemonstracao } from './SeloDemonstracao'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from '../../../styles/components/DashboardTabs/QualidadeDadosTab.module.css'

export function QualidadeDadosTab({ demo = false }: { demo?: boolean; filtros?: FiltrosDashboard } = {}) {
  return (
    <section className={estilos.semFonte} aria-labelledby="fonte-qualidade">
      <h2 id="fonte-qualidade">Qualidade dos dados e alertas</h2>
      {demo && <SeloDemonstracao />}
      <p>Ainda não há dados para exibir aqui.</p>
    </section>
  )
}
