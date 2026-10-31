import type { ItemResponse } from '../item'


export interface RemoveDialogProps {
  item: ItemResponse
  onClose: () => void
  onDone: (message: string) => void
}
