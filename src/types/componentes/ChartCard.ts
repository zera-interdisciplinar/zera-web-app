import type { ReactNode } from 'react'

export interface ChartCardProps {
  titulo: string
  children: ReactNode
  altura?: number
  nota?: string
  demo?: boolean
}
