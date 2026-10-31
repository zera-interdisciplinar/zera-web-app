import type { OverviewState, OverviewAction, OverviewStatus } from '../types/dashboard'



export const initialOverviewState: OverviewState = { connection: 'connecting', snapshot: null, unavailable: null, error: null }

export function overviewReducer(state: OverviewState, action: OverviewAction): OverviewState {
  switch (action.type) {
    case 'reset': return initialOverviewState
    case 'connection': return { ...state, connection: action.state }
    // A new batch always replaces the previous content; an error from an earlier connection is over.
    case 'snapshot': return { ...state, snapshot: action.snapshot, unavailable: null, error: null }
    case 'unavailable': return { ...state, snapshot: null, unavailable: action.detail, error: null }
    case 'failed': return { ...state, error: action.error }
  }
}

/** What the badge and the page body show. While reconnecting, the last snapshot stays on screen. */
export function overviewStatus(state: OverviewState): OverviewStatus {
  if (state.error) return 'error'
  if (state.unavailable !== null) return 'unavailable'
  if (state.connection === 'reconnecting' && state.snapshot) return 'reconnecting'
  if (state.connection === 'reconnecting') return 'connecting'
  return state.snapshot ? 'live' : 'connecting'
}
