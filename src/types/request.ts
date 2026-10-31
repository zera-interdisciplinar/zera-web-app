/** What `useRequest` returns: exactly one of loading, data or error is meaningful at a time. */
export interface RequestState<T> {
  data: T | null
  loading: boolean
  error: string | null
  reload: () => void
}

export type RequestResult<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

export type RequestAction<T> =
  | { type: 'start' }
  | { type: 'success'; data: T }
  | { type: 'failure'; message: string }
