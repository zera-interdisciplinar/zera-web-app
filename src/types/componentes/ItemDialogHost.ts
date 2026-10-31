import type { ItemTarget } from '../itemTarget'

export interface ItemDialogHostProps {
  target: ItemTarget | null
  onTarget: (target: ItemTarget | null) => void
  notify: (message: string) => void
}
