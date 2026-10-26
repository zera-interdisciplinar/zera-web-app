import type { ItemResponse, ItemStatus } from '../schemas/item'

export type ItemAction = 'edit' | 'approve' | 'reject' | 'submit' | 'remove' | 'restore'

const EDITABLE: ItemStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'IN_STOCK', 'IN_USE', 'IN_MAINTENANCE', 'AWAITING_EVALUATION']

/**
 * What the manager can do from the item's current status (BR-13, BR-14). The state machine itself is not
 * reimplemented: the server answers 409 for anything this list misses, and the screen reloads the item.
 */
export function availableActions(item: Pick<ItemResponse, 'status'>): ItemAction[] {
  const actions: ItemAction[] = []
  if (EDITABLE.includes(item.status)) actions.push('edit')
  if (item.status === 'PENDING_APPROVAL') actions.push('approve', 'reject')
  if (item.status === 'DRAFT' || item.status === 'REJECTED') actions.push('submit')
  if (item.status === 'REMOVED') actions.push('restore')
  // Removal is a correction of the registry; a disposed item only comes back by cancelling the disposal.
  if (item.status !== 'REMOVED' && item.status !== 'DISPOSED') actions.push('remove')
  return actions
}

export const ACTION_LABEL: Record<ItemAction, string> = {
  edit: 'Editar', approve: 'Aprovar', reject: 'Reprovar', submit: 'Concluir cadastro', remove: 'Remover', restore: 'Restaurar',
}
