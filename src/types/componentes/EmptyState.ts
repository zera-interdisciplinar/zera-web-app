import type { ReactNode } from 'react'

export interface EmptyStateProps {
  titulo: string
  descricao: string
  acao?: ReactNode
  nivelTitulo?: 'h1' | 'h2'
}
