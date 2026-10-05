import { ROTULO_STATUS } from '../../types/produto'
import type { StatusItem } from '../../types/produto'
import estilos from './StatusText.module.css'

export interface StatusTextProps {
  status: StatusItem
}

export function StatusText({ status }: StatusTextProps) {
  return <span className={`${estilos.status} ${estilos[status]}`}>{ROTULO_STATUS[status]}</span>
}
