import type { LucideIcon } from 'lucide-react'

export interface KpiCardProps {
  rotulo: string
  valor: string
  delta: string
  tomDelta: 'navy' | 'verde' | 'ambar'
  Icone: LucideIcon
  fundoIcone: 'navy' | 'verde' | 'ambar'
}
