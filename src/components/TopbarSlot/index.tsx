import { createPortal } from 'react-dom'
import { useTopbarElement } from '../../hooks/useTopbarSlot'
import type { TopbarSlotProps } from '../../types/componentes/TopbarSlot'

/** A page renders its top bar content with this; it appears in the outlet and disappears with the page. */
export function TopbarSlot({ children }: TopbarSlotProps) {
  const target = useTopbarElement()
  return target ? createPortal(children, target) : null
}
