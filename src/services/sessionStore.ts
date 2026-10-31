import type { SessionState } from '../types/auth'


type Listener = () => void

/** Framework-agnostic store; React reads it with `useSyncExternalStore`. */
export function createSessionStore(initial: SessionState) {
  let state = initial
  const listeners = new Set<Listener>()
  const expiryObservers = new Set<Listener>()
  return {
    getState: (): SessionState => state,
    setState(next: SessionState): void {
      state = next
      listeners.forEach((listener) => listener())
    },
    subscribe(listener: Listener): () => void {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    /** Legacy services want to know when a session ended because it expired. */
    onExpired(observer: Listener): () => void {
      expiryObservers.add(observer)
      return () => { expiryObservers.delete(observer) }
    },
    notifyExpired(): void {
      expiryObservers.forEach((observer) => observer())
    },
  }
}
