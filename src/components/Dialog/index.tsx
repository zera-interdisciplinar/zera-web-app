import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import styles from '../../../styles/components/Dialog/Dialog.module.css'
import type { DialogProps } from '../../types/componentes/Dialog'

/** The control that receives focus when the dialog opens: a marked one, otherwise the first field. */
const FIRST_FOCUS = '[data-autofocus], input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled)'

/**
 * Modal built on the native <dialog>: the browser traps focus, makes the rest of the page inert and returns
 * focus to the opener. Esc is routed to `onClose` so unsaved work can be protected.
 */
export function Dialog({ open, title, onClose, children, tone = 'light', width = 40 }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (open && !element.open) {
      element.showModal()
      // Focus goes to the safest or most useful control, not to the "close" button that comes first in the markup.
      element.querySelector<HTMLElement>(FIRST_FOCUS)?.focus()
    }
    // On unmount the dialog is already detached, so the browser cannot restore focus by itself.
    return () => {
      if (element.open) element.close()
      if (opener?.isConnected) opener.focus()
    }
  }, [open])

  return (
    <dialog
      ref={ref} className={`${styles.dialog} ${styles[tone]}`} style={{ maxWidth: `min(${width}rem, calc(100vw - 2rem))` }}
      aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose() }}
    >
      {open && (
        <div className={styles.content}>
          <header className={styles.header}>
            <h2 id={titleId}>{title}</h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Fechar"><X aria-hidden="true" /></button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  )
}
