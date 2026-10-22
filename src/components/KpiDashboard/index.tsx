import estilos from '../../../styles/components/DashboardTabs/VisaoGeralTab.module.css'
import type { KpiDashboardProps } from '../../types/componentes/KpiDashboard'

export function KpiDashboard({ titulo, valor, nota }: KpiDashboardProps) {
  return <article className={estilos.kpi}><h2>{titulo}</h2><p className={estilos.valor}>{valor}</p>{nota && <p className={estilos.nota}>{nota}</p>}</article>
}
