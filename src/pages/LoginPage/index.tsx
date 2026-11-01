import { useState } from 'react'
import { AtSign, LockKeyhole, Mail } from 'lucide-react'
import { Button } from '../../components/Button'
import { FieldCard } from '../../components/FieldCard'
import { Formulario } from '../../components/Formulario'
import { Logo } from '../../components/Logo'
import { useAuth } from '../../hooks/useAuth'
import { ForgotPasswordDialog } from '../../components/ForgotPasswordDialog'
import { loginCopy } from '../../utils/loginCopy'
import { useLoginForm } from '../../hooks/useLoginForm'
import styles from '../../../styles/pages/LoginPage/LoginPage.module.css'

export default function LoginPage() {
  const { autenticado, aviso } = useAuth()
  const { state, submit, change } = useLoginForm(autenticado)
  const [forgotOpen, setForgotOpen] = useState(false)
  const locked = state.secondsLeft > 0

  return (
    <main className={styles.pagina} id="conteudo" tabIndex={-1} data-public-page>
      <aside className={styles.marca} aria-label="Sobre o Zera">
        <div className={styles.marcaCentral}>
          <Logo tom="claro" />
          <p className={styles.selo}>GESTÃO DE RESÍDUOS ELETRÔNICOS</p>
          <h2 className={styles.tagline}>
            Transformando descarte em <span>solução.</span>
          </h2>
          <p className={styles.descricao}>Acompanhe cada etapa e dê um novo destino ao que ainda tem valor.</p>
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
            <p className={styles.eyebrow}>PORTAL DE GESTÃO</p>
            <h1 id="titulo-login">{loginCopy.title}</h1>
            <p className={styles.subtitulo}>{loginCopy.subtitle}</p>
            {aviso && !state.failure && <p className={styles.erroGeral} role="status">{aviso}</p>}
            <Formulario className={styles.formulario} onSubmit={submit} noValidate>
              <FieldCard
                id="email" obrigatorio rotulo={loginCopy.email} tipo="email" valor={state.email}
                aoMudar={(value) => change('email', value)} erro={state.errors.email}
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
