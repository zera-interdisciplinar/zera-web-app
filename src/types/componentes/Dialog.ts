import type { ReactNode } from 'react'

export interface DialogProps {
  open: boolean
  title: string
  description: string
  /** Asked for by the close button and by Esc; the owner decides whether to close (for example, after a confirmation). */
  onClose: () => void
  children: ReactNode
  tone?: 'light' | 'navy'
  /** Maximum width in rem. */
  width?: number
}
