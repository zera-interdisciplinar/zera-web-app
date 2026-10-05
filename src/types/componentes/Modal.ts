import type { ReactNode } from 'react'

export interface ModalProps {
  aberto: boolean
  titulo: string
  aoFechar: () => void
  children: ReactNode
  larguraMaxima?: number
}
