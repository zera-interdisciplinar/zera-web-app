import type { ReactNode } from 'react'

export interface OpcaoCampo {
  valor: string
  rotulo: string
}

export type TipoFieldCard = 'texto' | 'email' | 'senha' | 'numero' | 'select' | 'textarea'

export interface FieldCardProps {
  id: string
  rotulo: string
  valor: string
  aoMudar: (valor: string) => void
  tipo?: TipoFieldCard
  opcoes?: OpcaoCampo[]
  erro?: string
  placeholder?: string
  maxLength?: number
  autoComplete?: string
  desabilitado?: boolean
  icone?: ReactNode
  modoLogin?: boolean
  autoFocus?: boolean
  obrigatorio?: boolean
}
