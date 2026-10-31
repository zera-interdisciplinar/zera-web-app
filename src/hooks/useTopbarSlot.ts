import { useSyncExternalStore } from 'react'

let element: HTMLElement | null = null
const listeners = new Set<() => void>()

/** Registered by the outlet's `ref`: where the shell shows page-specific content in the top bar. */
export function setTopbarElement(next: HTMLElement | null): void {
  element = next
  listeners.forEach((listener) => listener())
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }

/** The current outlet element, or `null` while the shell is not mounted. */
export function useTopbarElement(): HTMLElement | null {
  return useSyncExternalStore(subscribe, () => element, () => null)
}
