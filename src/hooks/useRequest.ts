import { useCallback, useEffect, useReducer, useState } from 'react'
import { initialRequest, requestReducer } from '../reducers/requestReducer'
import type { RequestResult, RequestState } from '../types/request'
import { describeApiError, isAbortError } from '../utils/apiError'

/**
 * Runs `fetcher` and exposes `{ data, loading, error, reload }`. The previous call is aborted (AbortController)
 * when the fetcher changes, `enabled` turns off or the component unmounts, so a late answer never updates state
 * that is gone. `fetcher` must be stable: wrap it in `useCallback` with the values it reads. A new `refreshKey`
 * repeats the request (for example, when the record it describes was updated elsewhere).
 */
export function useRequest<T>(fetcher: (signal: AbortSignal) => Promise<T>, enabled = true, refreshKey: string | number = 0): RequestState<T> {
  const [result, dispatch] = useReducer(requestReducer<T>, initialRequest as RequestResult<T>)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    dispatch({ type: 'start' })
    fetcher(controller.signal)
      .then((data) => { if (!controller.signal.aborted) dispatch({ type: 'success', data }) })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return
        dispatch({ type: 'failure', message: describeApiError(error) })
      })
    return () => controller.abort()
  }, [fetcher, enabled, attempt, refreshKey])

  // The identity only matters to consumers that put `reload` in their own dependency arrays.
  const reload = useCallback(() => setAttempt((value) => value + 1), [])
  return {
    data: result.status === 'success' ? result.data : null,
    loading: enabled && result.status === 'loading',
    error: result.status === 'error' ? result.message : null,
    reload,
  }
}
