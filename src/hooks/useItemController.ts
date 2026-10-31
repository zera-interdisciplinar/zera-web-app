import { useState } from 'react'

import type { ItemTarget } from '../types/itemTarget'

import { useItemCommands } from './useItemCommands'
import type { ItemAction, ItemResponse } from '../types/item'

/**
 * Routes a row or detail action: the ones that need input open a dialog, the others run at once.
 * Shared by the list and the detail page.
 */
export function useItemController(notify: (message: string) => void) {
  const [target, setTarget] = useState<ItemTarget | null>(null)
  const commands = useItemCommands(notify)

  function onAction(action: ItemAction, item: ItemResponse) {
    if (action === 'edit' || action === 'reject' || action === 'remove') setTarget({ kind: action, item })
    else commands[action](item)
  }
  return { target, setTarget, onAction, busy: commands.busy }
}
