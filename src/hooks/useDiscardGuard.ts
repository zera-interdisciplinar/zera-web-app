import { useState } from 'react'

/**
 * Closing a form with unsaved changes asks first. `requestClose` is what the close button, Cancel and Esc call;
 * the form renders a confirmation while `asking` is true.
 */
export function useDiscardGuard(dirty: boolean, onClose: () => void) {
  const [asking, setAsking] = useState(false)
  return {
    asking,
    requestClose: () => { if (dirty) setAsking(true); else onClose() },
    confirmDiscard: onClose,
    keepEditing: () => setAsking(false),
  }
}
