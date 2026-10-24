import type { SessionUser } from './gate'

export type SessionStatus = 'restoring' | 'anonymous' | 'authenticated'

export interface Session {
  accessToken: string
  refreshToken: string
  /** Epoch milliseconds at which the access token expires. */
  expiresAt: number
  user: SessionUser
}

export interface SessionState {
  status: SessionStatus
  session: Session | null
  /** Why the user is back at the login screen (expired session, rejected role...). */
  notice: string | null
}

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

export type SessionStore = ReturnType<typeof createSessionStore>
