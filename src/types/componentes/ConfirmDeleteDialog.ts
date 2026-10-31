export interface ConfirmDeleteDialogProps {
  title: string
  message: string
  pending: boolean
  /** Already translated; shown when the server refuses (for example, a 409 because it is in use). */
  error?: string
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}
