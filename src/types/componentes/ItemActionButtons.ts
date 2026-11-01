import type { ItemResponse, ItemAction } from '../item'



export interface ItemActionButtonsProps {
  item: ItemResponse
  onAction: (action: ItemAction, item: ItemResponse) => void
  disabled?: boolean
}
