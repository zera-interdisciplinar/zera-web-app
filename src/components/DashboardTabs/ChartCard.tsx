import type { ReactNode } from 'react'
import { SeloDemonstracao } from './SeloDemonstracao'
import estilos from './ChartCard.module.css'

interface Props {
  titulo: string
  children: ReactNode
  altura?: number
  nota?: string
  demo?: boolean
}

export function ChartCard({ titulo, children, altura = 260, nota, demo = false }: Props) {
  return (
    <section className={estilos.cartao} aria-label={titulo}>
      <h2 className={estilos.titulo}>{titulo}{demo && <SeloDemonstracao />}</h2>
      {nota && <p className={estilos.nota}>{nota}</p>}
      <div className={estilos.grafico} style={{ height: altura }}>{children}</div>
    </section>
  )
}
