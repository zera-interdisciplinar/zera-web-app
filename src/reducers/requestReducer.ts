import type { RequestAction, RequestResult } from '../types/request'

export const initialRequest: RequestResult<never> = { status: 'loading' }

/** Loading, success and error are one value, so the screen can never show two of them at once. */
export function requestReducer<T>(state: RequestResult<T>, action: RequestAction<T>): RequestResult<T> {
  switch (action.type) {
    case 'start': return state.status === 'loading' ? state : { status: 'loading' }
    case 'success': return { status: 'success', data: action.data }
    case 'failure': return { status: 'error', message: action.message }
  }
}
