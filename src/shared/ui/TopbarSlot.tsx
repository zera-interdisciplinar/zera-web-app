import { useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

let element: HTMLElement | null = null
const listeners = new Set<() => void>()

function setElement(next: HTMLElement | null): void {
  element = next
  listeners.forEach((listener) => listener())
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

/** Where the shell shows page-specific content in the top bar (for example, the dashboard filter summary). */
export function TopbarSlotOutlet({ className }: { className?: string }) {
  return <div ref={setElement} className={className} />
}

/** A page renders its top bar content with this; it appears in the outlet and disappears with the page. */
export function TopbarSlot({ children }: { children: ReactNode }) {
  const target = useSyncExternalStore(subscribe, () => element, () => null)
  return target ? createPortal(children, target) : null
}
