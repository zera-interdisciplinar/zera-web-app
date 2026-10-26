import type { ItemResponse } from '../schemas/item'

/** Which dialog is open and for what. `null` means none. */
export type ItemTarget =
  | { kind: 'create' }
  | { kind: 'edit'; item: ItemResponse; missingFields?: string[] }
  | { kind: 'reject' | 'remove'; item: ItemResponse }
