import { useSyncExternalStore } from 'react'
import { sessionStore } from '../services/session'
import type { SessionState } from '../types/auth'

/** The current session state; re-renders when it changes. */
export function useSession(): SessionState {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.getState, sessionStore.getState)
}
