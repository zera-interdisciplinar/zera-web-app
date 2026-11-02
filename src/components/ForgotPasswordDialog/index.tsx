import { useForgotPasswordForm } from '../../hooks/useForgotPasswordForm'
import type { ForgotPasswordDialogProps } from '../../types/componentes/ForgotPasswordDialog'
import { forgotCopy } from '../../utils/loginCopy'
import { Button } from '../Button'
import { FieldCard } from '../FieldCard'
import { Formulario } from '../Formulario'
import { Modal } from '../Modal'

export function ForgotPasswordDialog({ open, onClose }: ForgotPasswordDialogProps) {
  const { state, dispatch, close, submit } = useForgotPasswordForm({ open, onClose })

  return (
    <Modal aberto={open} titulo={forgotCopy.title} descricao={state.done ? forgotCopy.confirmation : forgotCopy.intro} aoFechar={close} larguraMaxima={520}>
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
            autoComplete="email" maxLength={120} placeholder="email@exemplo.com" desabilitado={state.sending}
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
