import { useReducer, type FormEvent } from 'react'
import { Button } from '../Button'
import { FieldCard } from '../FieldCard'
import { Formulario } from '../Formulario'
import { Modal } from '../Modal'
import { usePasswordReset } from '../../hooks/usePasswordReset'
import { forgotCopy } from '../../utils/loginCopy'
import { fieldErrors, forgotPasswordSchema } from '../../utils/loginValidation'
import type { ForgotPasswordDialogProps } from '../../types/componentes/ForgotPasswordDialog'

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

export function ForgotPasswordDialog({ open, onClose }: ForgotPasswordDialogProps) {
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

  return (
    <Modal aberto={open} titulo={forgotCopy.title} aoFechar={close} larguraMaxima={520}>
      {state.done ? (
        <div>
          <p role="status">{forgotCopy.confirmation}</p>
          <Button variante="secundario" tamanho="grande" onClick={close}>{forgotCopy.cancel}</Button>
        </div>
      ) : (
        <Formulario onSubmit={submit} noValidate>
          <p>{forgotCopy.intro}</p>
          <FieldCard
            id="email-recuperacao" obrigatorio rotulo="Email" tipo="email" valor={state.email}
            aoMudar={(value) => dispatch({ type: 'change', value })} erro={state.error}
            autoComplete="email" maxLength={120} placeholder="email@exemplo.com" desabilitado={state.sending} autoFocus
          />
          <Button variante="primario" tamanho="grande" type="submit" disabled={state.sending}>
            {state.sending ? forgotCopy.sending : forgotCopy.submit}
          </Button>
          <Button variante="secundario" tamanho="grande" onClick={close} disabled={state.sending}>{forgotCopy.cancel}</Button>
        </Formulario>
      )}
    </Modal>
  )
}
