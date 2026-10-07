import type { DonutChartProps } from '../../types/componentes/DonutChart'
export type { DonutChartProps } from '../../types/componentes/DonutChart'
import estilos from '../../../styles/components/DonutChart/DonutChart.module.css'

const RAIO = 80
const CIRCUNFERENCIA = 2 * Math.PI * RAIO

export function DonutChart({ percentual, meta }: DonutChartProps) {
  const arco = (percentual / 100) * CIRCUNFERENCIA

  return (
    <div
      className={estilos.envoltorio}
      role="img"
      aria-label={`Circularidade: ${percentual}% da meta anual de ${meta}%`}
    >
      <svg viewBox="0 0 200 200" className={estilos.grafico} aria-hidden="true">
        <circle cx="100" cy="100" r={RAIO} fill="none" className={estilos.trilho} strokeWidth="28" />
        <circle
          cx="100"
          cy="100"
          r={RAIO}
          fill="none"
          className={estilos.arco}
          strokeWidth="28"
          strokeDasharray={`${arco} ${CIRCUNFERENCIA}`}
          transform="rotate(-90 100 100)"
        />
      </svg>
      <p className={estilos.centro}>
        <span className={estilos.valor}>{percentual}%</span>
        <span className={estilos.meta}>meta {meta}%</span>
      </p>
    </div>
  )
}
