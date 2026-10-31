import type { UseFormRegisterReturn } from 'react-hook-form'
import type { ItemFieldErrors, SharedField } from '../item'

export interface ItemFieldsProps {
  /** Adapter over the form's `register`, so the create and edit forms (different value types) can share these fields. */
  register: (name: SharedField) => UseFormRegisterReturn
  errors: ItemFieldErrors
  hasDamages: string | null | undefined
  /** Editing offers "Limpar" on the two fields the API can erase (BR-12). */
  onClear?: (field: 'serialNumber' | 'notes') => void
}
