import type { ItemResponse } from '../item'


export interface CreateItemDialogProps {
  onClose: () => void
  onCreated: (message: string) => void
  /** The item was saved as a draft because the submit asked for more data; the form continues in edit mode. */
  onDraft: (item: ItemResponse, missingFields: string[]) => void
}
