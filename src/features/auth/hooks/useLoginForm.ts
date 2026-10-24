import { useEffect, useReducer, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { sessionManager } from '../../../shared/auth'
import { describeLoginError, safeRedirect } from '../loginErrors'
import { fieldErrors, loginSchema, type FieldErrors } from '../schemas'

const MAX_FAILURES = 3
const COOLDOWN_MS = 3000

interface State {
  email: string
  password: string
  errors: FieldErrors<'email' | 'password'>
  submitting: boolean
  failure: string | null
  failures: number
  lockedUntil: number
  secondsLeft: number
}

type Action =
  | { type: 'change'; field: 'email' | 'password'; value: string }
  | { type: 'invalid'; errors: State['errors'] }
  | { type: 'submit' }
  | { type: 'failed'; message: string; countsAsAttempt: boolean; now: number }
  | { type: 'tick'; secondsLeft: number }

const initial: State = { email: '', password: '', errors: {}, submitting: false, failure: null, failures: 0, lockedUntil: 0, secondsLeft: 0 }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'change': return { ...state, [action.field]: action.value, failure: null, errors: { ...state.errors, [action.field]: undefined } }
    case 'invalid': return { ...state, errors: action.errors, failure: null }
    case 'submit': return { ...state, submitting: true, failure: null, errors: {} }
    case 'failed': {
      const failures = action.countsAsAttempt ? state.failures + 1 : 0
      const locked = failures >= MAX_FAILURES
      return {
        ...state, submitting: false, failure: action.message, email: '', password: '', failures: locked ? 0 : failures,
        lockedUntil: locked ? action.now + COOLDOWN_MS : state.lockedUntil, secondsLeft: locked ? COOLDOWN_MS / 1000 : state.secondsLeft,
      }
    }
    case 'tick': return action.secondsLeft <= 0 ? { ...state, lockedUntil: 0, secondsLeft: 0, failures: 0 } : { ...state, secondsLeft: action.secondsLeft }
  }
}

export function useLoginForm(authenticated: boolean) {
  const [state, dispatch] = useReducer(reducer, initial)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (authenticated) navigate(safeRedirect(location.state), { replace: true })
  }, [authenticated, navigate, location.state])

  useEffect(() => {
    if (!state.lockedUntil) return
    const tick = () => dispatch({ type: 'tick', secondsLeft: Math.max(0, Math.ceil((state.lockedUntil - Date.now()) / 1000)) })
    const timer = window.setInterval(tick, 200)
    return () => window.clearInterval(timer)
  }, [state.lockedUntil])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.submitting || state.secondsLeft > 0) return
    const parsed = loginSchema.safeParse({ email: state.email, password: state.password })
    if (!parsed.success) {
      const errors = fieldErrors<'email' | 'password'>(parsed.error)
      dispatch({ type: 'invalid', errors })
      document.getElementById(errors.email ? 'email' : 'senha')?.focus()
      return
    }
    dispatch({ type: 'submit' })
    try {
      await sessionManager.signIn(parsed.data.email, parsed.data.password)
    } catch (error) {
      const failure = describeLoginError(error)
      dispatch({ type: 'failed', ...failure, now: Date.now() })
      requestAnimationFrame(() => document.getElementById('email')?.focus())
    }
  }

  return { state, submit, change: (field: 'email' | 'password', value: string) => dispatch({ type: 'change', field, value }) }
}
