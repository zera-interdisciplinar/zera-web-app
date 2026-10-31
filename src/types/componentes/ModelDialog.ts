import type { Model } from '../item'


export interface ModelDialogProps {
  /** Present when editing. Category, weight and notes have no PATCH in the API, so they stay read-only. */
  model?: Model
  onClose: () => void
  onDone: (message: string) => void
}
