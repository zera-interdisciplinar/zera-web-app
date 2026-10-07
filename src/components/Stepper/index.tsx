import type { StepperProps } from '../../types/componentes/Stepper'
export type { StepperProps } from '../../types/componentes/Stepper'
import { Check } from 'lucide-react'
import estilos from '../../../styles/components/Stepper/Stepper.module.css'

export function Stepper({ etapas, atual }: StepperProps) {
  return (
    <ol className={estilos.trilha} aria-label="Etapas da triagem">
      {etapas.map((etapa, indice) => {
        const concluida = indice < atual
        const corrente = indice === atual
        return (
          <li
            key={etapa}
            className={estilos.etapa}
            aria-current={corrente ? 'step' : undefined}
          >
            <span
              className={`${estilos.circulo} ${concluida ? estilos.concluida : ''} ${corrente ? estilos.corrente : ''}`}
              aria-hidden="true"
            >
              {concluida ? <Check size={16} /> : indice + 1}
            </span>
            <span
              className={`${estilos.rotulo} ${corrente ? estilos.rotuloCorrente : ''} ${concluida ? estilos.rotuloConcluida : ''}`}
            >
              {etapa}
            </span>
            {indice < etapas.length - 1 && <span className={estilos.conector} aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}
