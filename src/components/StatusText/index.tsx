import type { StatusTextProps } from '../../types/componentes/StatusText'
export type { StatusTextProps } from '../../types/componentes/StatusText'
import { ROTULO_STATUS } from '../../types/produto'

import estilos from '../../../styles/components/StatusText/StatusText.module.css'

export function StatusText({ status }: StatusTextProps) {
  return <span className={`${estilos.status} ${estilos[status]}`}>{ROTULO_STATUS[status]}</span>
}
