import type { ItemResponse } from '../item'


export interface EditItemDialogProps {
  item: ItemResponse
  /** Fields the server said were missing when a draft could not be submitted (BR-10). */
  missingFields?: string[]
  onClose: () => void
  onSaved: (message: string) => void
}
