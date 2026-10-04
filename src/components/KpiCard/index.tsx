import type { LucideIcon } from 'lucide-react'
import estilos from './KpiCard.module.css'

export interface KpiCardProps {
  rotulo: string
  valor: string
  delta: string
  tomDelta: 'navy' | 'verde' | 'ambar'
  Icone: LucideIcon
  fundoIcone: 'navy' | 'verde' | 'ambar'
}

export function KpiCard({ rotulo, valor, delta, tomDelta, Icone, fundoIcone }: KpiCardProps) {
  return (
    <article className={estilos.card}>
      <div className={estilos.topo}>
        <h2 className={estilos.rotulo}>{rotulo}</h2>
        <span className={`${estilos.icone} ${estilos[`fundo-${fundoIcone}`]}`} aria-hidden="true">
          <Icone size={20} />
        </span>
      </div>
      <p className="valor-kpi">{valor}</p>
      <p className={`${estilos.delta} ${estilos[`delta-${tomDelta}`]}`}>{delta}</p>
    </article>
  )
}
