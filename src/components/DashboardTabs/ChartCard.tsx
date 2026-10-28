import type { ReactNode } from 'react'
import estilos from '../../../styles/components/DashboardTabs/ChartCard.module.css'

interface Props {
  titulo: string
  children: ReactNode
  altura?: number
  nota?: string
}

export function ChartCard({ titulo, children, altura = 260, nota }: Props) {
  return (
    <section className={estilos.cartao} aria-label={titulo}>
      <h2 className={estilos.titulo}>{titulo}</h2>
      {nota && <p className={estilos.nota}>{nota}</p>}
      <div className={estilos.grafico} style={{ height: altura }}>{children}</div>
    </section>
  )
}
