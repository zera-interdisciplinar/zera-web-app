import type { ItemResponse } from '../item'


export interface RejectDialogProps {
  item: ItemResponse
  onClose: () => void
  onDone: (message: string) => void
}
