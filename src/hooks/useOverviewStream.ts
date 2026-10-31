import { useEffect, useReducer, useState } from 'react'
import { ApiError } from '../utils/apiError'
import { openOverviewStream } from '../services/dashboard'

import { sessionManager } from '../services/session'
import { filtersKey } from '../utils/dashboardFilters'
import { snapshotSchema, unavailableSchema } from '../utils/snapshotValidation'
import { initialOverviewState, overviewReducer, overviewStatus } from '../reducers/overviewReducer'
import type { SseClient } from '../types/http'
import type { DashboardFilters } from '../types/dashboard'

/**
 * One SSE connection per set of filters (BR-06). It stays open and is closed when the filters change,
 * the page unmounts or the session ends (BR-20).
 */
export function useOverviewStream(filters: DashboardFilters, client?: SseClient) {
  const [state, dispatch] = useReducer(overviewReducer, initialOverviewState)
  const [attempt, setAttempt] = useState(0)
  const key = filtersKey(filters)

  useEffect(() => {
    const controller = new AbortController()
    const stopOnSignOut = sessionManager.onSignOut(() => controller.abort())
    dispatch({ type: 'reset' })
    void openOverviewStream(JSON.parse(key) as Record<string, string | undefined>, controller.signal, {
      onState: (connection) => dispatch({ type: 'connection', state: connection }),
      onFatal: (error) => dispatch({ type: 'failed', error }),
      onEvent: ({ name, data }) => {
        if (name === 'snapshot') {
          const parsed = snapshotSchema.safeParse(data)
          if (parsed.success) dispatch({ type: 'snapshot', snapshot: parsed.data })
          else dispatch({ type: 'failed', error: new ApiError('Snapshot fora do contrato.', { kind: 'contract', detail: parsed.error.issues.slice(0, 3).map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ') }) })
        } else if (name === 'unavailable') {
          const parsed = unavailableSchema.safeParse(data)
          dispatch({ type: 'unavailable', detail: parsed.success ? parsed.data.detail : 'snapshot not ready' })
        }
      },
    }, client)
    return () => { stopOnSignOut(); controller.abort() }
  }, [key, attempt, client])

  return { ...state, status: overviewStatus(state), reconnect: () => setAttempt((value) => value + 1) }
}
