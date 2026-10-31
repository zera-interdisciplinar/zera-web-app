import type { ReactNode } from 'react'
import type { Tone } from '../dashboard'

export interface KpiCardProps {
  title: string
  value: string
  icon: ReactNode
  iconTone: Tone
  note?: ReactNode
  noteTone?: Tone
}
