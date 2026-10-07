import type { ReactNode } from 'react'

export interface OpcaoFiltro {
  valor: string
  rotulo: string
}

export interface FilterChipProps {
  rotulo: ReactNode
  aparencia?: 'pill' | 'texto'
  ativo?: boolean
  aoClicar?: () => void
  opcoes?: OpcaoFiltro[]
  valorAtual?: string
  aoSelecionar?: (valor: string) => void
}
