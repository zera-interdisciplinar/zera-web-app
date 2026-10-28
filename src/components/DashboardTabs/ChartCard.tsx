import type { ReactNode } from 'react'
import estilos from '../../../styles/components/DashboardTabs/ChartCard.module.css'
import { SeloDemonstracao } from './SeloDemonstracao'

interface Props {
  titulo: string
  children: ReactNode
  altura?: number
  nota?: string
  demo?: boolean
}

export function ChartCard({ titulo, children, altura = 260, nota, demo }: Props) {
  return (
    <section className={estilos.cartao} aria-label={titulo}>
      <h2 className={estilos.titulo}>{titulo}</h2>
      {demo && <SeloDemonstracao />}
      {nota && <p className={estilos.nota}>{nota}</p>}
      <div className={estilos.grafico} style={{ height: altura }}>{children}</div>
    </section>
  )
}
