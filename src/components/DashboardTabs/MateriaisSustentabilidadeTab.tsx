import { SeloDemonstracao } from './SeloDemonstracao'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from '../../../styles/components/DashboardTabs/MateriaisSustentabilidadeTab.module.css'

export function MateriaisSustentabilidadeTab({ demo = false }: { demo?: boolean; filtros?: FiltrosDashboard } = {}) {
  return (
    <section className={estilos.semFonte} aria-labelledby="fonte-materiais">
      <h2 id="fonte-materiais">Materiais e sustentabilidade</h2>
      {demo && <SeloDemonstracao />}
      <p>Ainda não há dados para exibir aqui.</p>
    </section>
  )
}
