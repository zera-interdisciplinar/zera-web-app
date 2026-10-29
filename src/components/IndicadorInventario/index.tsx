import estilos from '../../../styles/components/DashboardTabs/VisaoGeralTab.module.css'
import type { IndicadorInventarioProps } from '../../types/componentes/IndicadorInventario'
import { formatarNumero } from '../../utils/formatarDashboard'

export function IndicadorInventario({ titulo, valor, nota }: IndicadorInventarioProps) {
  return <article className={estilos.kpi}><h2>{titulo}</h2><p className={estilos.valor}>{formatarNumero(valor, 2)}</p>{nota && <p className={estilos.nota}>{nota}</p>}</article>
}
