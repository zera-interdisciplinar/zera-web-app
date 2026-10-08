import estilos from '../../../styles/components/DashboardTabs/VisaoGeralTab.module.css'
import type { KpiDashboardProps } from '../../types/componentes/KpiDashboard'
import { SeloDemonstracao } from '../DashboardTabs/SeloDemonstracao'

export function KpiDashboard({ titulo, valor, nota, demo }: KpiDashboardProps) {
  return <article className={estilos.kpi}><h2>{titulo}</h2>{demo && <SeloDemonstracao />}<p className={estilos.valor}>{valor}</p>{nota && <p className={estilos.nota}>{nota}</p>}</article>
}
