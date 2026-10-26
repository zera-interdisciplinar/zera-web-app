import { useEffect, useReducer, useState } from 'react'
import { ApiError } from '../../../shared/api/errors'
import { sse as defaultClient } from '../../../shared/api/http'
import type { SseClient } from '../../../shared/api/sse/sseClient'
import { sessionManager } from '../../../shared/auth'
import { filtersKey, type DashboardFilters } from '../model/filters'
import { snapshotSchema, unavailableSchema } from '../schemas/snapshot'
import { initialOverviewState, overviewReducer, overviewStatus } from './overviewState'

const PATH = '/api/v1/dashboard/overview'

/**
 * One SSE connection per set of filters (BR-06). It stays open and is closed when the filters change,
 * the page unmounts or the session ends (BR-20).
 */
export function useOverviewStream(filters: DashboardFilters, client: SseClient = defaultClient) {
  const [state, dispatch] = useReducer(overviewReducer, initialOverviewState)
  const [attempt, setAttempt] = useState(0)
  const key = filtersKey(filters)

  useEffect(() => {
    const controller = new AbortController()
    const stopOnSignOut = sessionManager.onSignOut(() => controller.abort())
    dispatch({ type: 'reset' })
    void client.connect('analytics', PATH, {
      query: JSON.parse(key) as Record<string, string | undefined>,
      signal: controller.signal,
      handlers: {
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
      },
    })
    return () => { stopOnSignOut(); controller.abort() }
  }, [key, attempt, client])

  return { ...state, status: overviewStatus(state), reconnect: () => setAttempt((value) => value + 1) }
}
