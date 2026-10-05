import { Formulario } from '../../components/Formulario'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { Button } from '../../components/Button'
import { FieldCard } from '../../components/FieldCard'
import { Logo } from '../../components/Logo'
import { SkipLink } from '../../components/SkipLink'
import { validarEmailRecuperacao } from '../../utils/validacao'
import estilos from '../../../styles/pages/RecuperarSenhaPage/RecuperarSenhaPage.module.css'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [erro, setErro] = useState<string | undefined>()
  const [confirmacao, setConfirmacao] = useState(false)

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

  return (
    <>
      <SkipLink />
      <main className={estilos.pagina} id="conteudo" tabIndex={-1}>
        <section className={estilos.cartao} aria-labelledby="titulo-recuperacao">
          <Logo />
          <h1 id="titulo-recuperacao">Esqueci minha senha</h1>
          <p className={estilos.subtitulo}>Informe seu e-mail corporativo para verificar as opções de recuperação.</p>

          <Formulario className={estilos.formulario} onSubmit={aoEnviar} noValidate>
            <FieldCard
              id="email" obrigatorio
              rotulo="Email"
              tipo="email"
              valor={email}
              aoMudar={(valor) => { setEmail(valor); setErro(undefined); setConfirmacao(false) }}
              erro={erro}
              autoComplete="email"
              maxLength={120}
              placeholder="nome@zera.com"
              icone={<Mail aria-hidden="true" />}
            />
            <Button variante="navy" tamanho="grande" type="submit" className={estilos.botao}>Continuar</Button>
          </Formulario>

          {confirmacao && (
            <div className={estilos.confirmacao}>
              <p role="status">A recuperação de senha ainda não está disponível. Peça ajuda ao responsável pelo acesso da sua unidade.</p>
            </div>
          )}

          <Link className={estilos.link} to="/login">Voltar para entrar</Link>
        </section>
      </main>
    </>
  )
}
