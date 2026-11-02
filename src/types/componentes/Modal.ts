import type { ReactNode } from 'react'

export interface ModalProps {
  aberto: boolean
  titulo: string
  descricao: string
  aoFechar: () => void
  children: ReactNode
  larguraMaxima?: number
}
