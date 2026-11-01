import { useReducer,type FormEvent } from 'react'
import type { ForgotPasswordDialogProps } from '../types/componentes/ForgotPasswordDialog'
import { fieldErrors,forgotPasswordSchema } from '../utils/loginValidation'
import { usePasswordReset } from './usePasswordReset'

interface State { email: string; error?: string; sending: boolean; done: boolean }
type Action = { type: 'change'; value: string } | { type: 'invalid'; error?: string } | { type: 'send' } | { type: 'done' } | { type: 'reset' }
const initial: State = { email: '', sending: false, done: false }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'change': return { ...state, email: action.value, error: undefined }
    case 'invalid': return { ...state, error: action.error }
    case 'send': return { ...state, sending: true, error: undefined }
    case 'done': return { ...state, sending: false, done: true }
    case 'reset': return initial
  }
}

export function useForgotPasswordForm({ onClose }: ForgotPasswordDialogProps) {
  const [state, dispatch] = useReducer(reducer, initial)
  const requestPasswordReset = usePasswordReset()

  function close() {
    dispatch({ type: 'reset' })
    onClose()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state.sending) return
    const parsed = forgotPasswordSchema.safeParse({ email: state.email })
    if (!parsed.success) {
      dispatch({ type: 'invalid', error: fieldErrors<'email'>(parsed.error).email })
      document.getElementById('email-recuperacao')?.focus()
      return
    }
    dispatch({ type: 'send' })
    await requestPasswordReset(parsed.data.email)
    dispatch({ type: 'done' })
  }

  return { state, dispatch, close, submit }
}
