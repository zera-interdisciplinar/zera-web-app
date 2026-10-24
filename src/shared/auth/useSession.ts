import { useSyncExternalStore } from 'react'
import type { SessionStore } from './sessionStore'

/** Builds the React hook around a store; `index.ts` binds it to the application store. */
export function createUseSession(store: SessionStore) {
  return () => useSyncExternalStore(store.subscribe, store.getState, store.getState)
}
