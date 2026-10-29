import type { SetStateAction } from 'react'
import { useMemo, useState } from 'react'
import type { EstadoLocalRecuperarSenha } from '../types/controles/EstadoLocalRecuperarSenha'
import { validarEmailRecuperacao } from '../utils/validacao'


export function useRecuperarSenha() {
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalRecuperarSenha>(() => ({
    email: '',
    erro: undefined,
    confirmacao: false,
  }))
  const { email, erro, confirmacao } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setEmail, setErro, setConfirmacao } = useMemo(() => ({
    setEmail: (valor: SetStateAction<EstadoLocalRecuperarSenha['email']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.email) : valor
      return Object.is(atual.email, proximo) ? atual : { ...atual, email: proximo }
    }),
    setErro: (valor: SetStateAction<EstadoLocalRecuperarSenha['erro']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erro) : valor
      return Object.is(atual.erro, proximo) ? atual : { ...atual, erro: proximo }
    }),
    setConfirmacao: (valor: SetStateAction<EstadoLocalRecuperarSenha['confirmacao']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.confirmacao) : valor
      return Object.is(atual.confirmacao, proximo) ? atual : { ...atual, confirmacao: proximo }
    }),
  }), [])

  function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setConfirmacao(false)
    const validacao = validarEmailRecuperacao(email)
    setEmail(validacao.email)
    setErro(validacao.erro)
    if (!validacao.valido) {
      document.getElementById('email')?.focus()
      return
    }

    // TODO(contrato): não há endpoint de recuperação confirmado no OpenAPI acessível.
    setConfirmacao(true)
  }
  return { email, setEmail, erro, setErro, confirmacao, setConfirmacao, aoEnviar }
}
