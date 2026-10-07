import type { KpiCardProps } from '../../types/componentes/KpiCard'
export type { KpiCardProps } from '../../types/componentes/KpiCard'

import estilos from '../../../styles/components/KpiCard/KpiCard.module.css'

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
