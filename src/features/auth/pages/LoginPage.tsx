import { useState } from 'react'
import { AtSign, LockKeyhole, Mail } from 'lucide-react'
import { Button } from '../../../components/Button'
import { FieldCard } from '../../../components/FieldCard'
import { Formulario } from '../../../components/Formulario'
import { Logo } from '../../../components/Logo'
import { sessionManager, useSession } from '../../../shared/auth'
import { ForgotPasswordDialog } from '../components/ForgotPasswordDialog'
import { loginCopy } from '../copy'
import { useLoginForm } from '../hooks/useLoginForm'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const session = useSession()
  const { state, submit, change } = useLoginForm(session.status === 'authenticated')
  const [forgotOpen, setForgotOpen] = useState(false)
  const locked = state.secondsLeft > 0

  return (
    <main className={styles.pagina} id="conteudo" tabIndex={-1} data-public-page>
      <aside className={styles.marca} aria-label="Sobre o Zera">
        <div className={styles.marcaCentral}>
          <Logo />
          <p className={styles.tagline}>
            TRANSFORMANDO <span>DESCARTE</span>
            <br />EM <span>SOLUÇÃO</span>
          </p>
        </div>
        <address className={styles.contatos}>
          <a href="https://www.instagram.com/zera.app_/" target="_blank" rel="noreferrer">
            <AtSign aria-hidden="true" />
            <span>@zera.app_</span>
          </a>
          <a href={`mailto:${loginCopy.contact}`}>
            <Mail aria-hidden="true" />
            <span>{loginCopy.contact}</span>
          </a>
        </address>
      </aside>
      <section className={styles.painel} aria-labelledby="titulo-login">
        <div className={styles.conteudoLogin}>
          <div className={styles.marcaMobile}>
            <Logo />
          </div>
          <section className={styles.cartao}>
            <h1 id="titulo-login">{loginCopy.title}</h1>
            <p className={styles.subtitulo}>{loginCopy.subtitle}</p>
            {session.notice && !state.failure && <p className={styles.erroGeral} role="status">{session.notice}</p>}
            <Formulario className={styles.formulario} onSubmit={submit} noValidate>
              <FieldCard
                id="email" obrigatorio rotulo={loginCopy.email} tipo="email" valor={state.email}
                aoMudar={(value) => { sessionManager.dismissNotice(); change('email', value) }} erro={state.errors.email}
                autoComplete="email" maxLength={120} placeholder={loginCopy.emailPlaceholder}
                icone={<Mail aria-hidden="true" />} modoLogin autoFocus
              />
              <FieldCard
                id="senha" obrigatorio rotulo={loginCopy.password} tipo="senha" valor={state.password}
                aoMudar={(value) => change('password', value)} erro={state.errors.password}
                autoComplete="current-password" maxLength={128} placeholder={loginCopy.passwordPlaceholder}
                icone={<LockKeyhole aria-hidden="true" />} modoLogin
              />
              {state.failure && <p className={styles.erroGeral} role="alert">{state.failure}</p>}
              {locked && <p className={styles.contador} role="status" aria-live="polite">Muitas tentativas seguidas. Tente novamente em {state.secondsLeft} s.</p>}
              <button type="button" className={styles.linkAuxiliar} onClick={() => setForgotOpen(true)}>{loginCopy.forgot}</button>
              <Button className={styles.botaoEntrar} variante="navy" tamanho="grande" type="submit" disabled={state.submitting || locked}>
                {state.submitting ? loginCopy.submitting : locked ? `Aguarde ${state.secondsLeft}s` : loginCopy.submit}
              </Button>
            </Formulario>
          </section>
        </div>
      </section>
      <ForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </main>
  )
}
