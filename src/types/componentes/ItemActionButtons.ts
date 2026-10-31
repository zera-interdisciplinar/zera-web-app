import type { ItemResponse, ItemAction } from '../item'



export interface ItemActionButtonsProps {
  item: ItemResponse
  onAction: (action: ItemAction, item: ItemResponse) => void
  disabled?: boolean
  /** In the table, edit and remove are icons (as in the Figma) and the rest are short text buttons. */
  compact?: boolean
}
