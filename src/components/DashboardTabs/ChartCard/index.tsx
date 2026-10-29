import estilos from '../../../../styles/components/DashboardTabs/ChartCard.module.css'
import type { ChartCardProps } from '../../../types/componentes/ChartCard'
import { SeloDemonstracao } from '../SeloDemonstracao'

export function ChartCard({ titulo, children, altura = 260, nota, demo }: ChartCardProps) {
  return (
    <section className={estilos.cartao} aria-label={titulo}>
      <h2 className={estilos.titulo}>{titulo}</h2>
      {demo && <SeloDemonstracao />}
      {nota && <p className={estilos.nota}>{nota}</p>}
      <div className={estilos.grafico} style={{ height: altura }}>{children}</div>
    </section>
  )
}
