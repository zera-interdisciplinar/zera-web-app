import { NOT_AVAILABLE } from '../../utils/format'
import type { FactProps } from '../../types/componentes/Fact'

export function Fact({ label, children }: FactProps) {
  return <div><dt>{label}</dt><dd>{children || NOT_AVAILABLE}</dd></div>
}
