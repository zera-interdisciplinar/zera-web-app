import { setTopbarElement } from '../../hooks/useTopbarSlot'
import type { TopbarSlotOutletProps } from '../../types/componentes/TopbarSlotOutlet'

/** Where the shell shows page-specific content in the top bar (for example, the dashboard filter summary). */
export function TopbarSlotOutlet({ className }: TopbarSlotOutletProps) {
  return <div ref={setTopbarElement} className={className} />
}
