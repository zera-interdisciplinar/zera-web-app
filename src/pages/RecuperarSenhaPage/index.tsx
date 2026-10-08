import { Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import estilos from '../../../styles/pages/RecuperarSenhaPage/RecuperarSenhaPage.module.css'
import { Button } from '../../components/Button'
import { FieldCard } from '../../components/FieldCard'
import { Formulario } from '../../components/Formulario'
import { Logo } from '../../components/Logo'
import { SkipLink } from '../../components/SkipLink'
import { useRecuperarSenha } from '../../hooks/useRecuperarSenha'

export default function RecuperarSenhaPage() {
  const { email, setEmail, erro, setErro, confirmacao, setConfirmacao, aoEnviar } = useRecuperarSenha()

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
