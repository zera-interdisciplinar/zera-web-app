import { AtSign, LockKeyhole, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import estilos from '../../../styles/pages/LoginPage/LoginPage.module.css'
import { Button } from '../../components/Button'
import { FieldCard } from '../../components/FieldCard'
import { Formulario } from '../../components/Formulario'
import { Logo } from '../../components/Logo'
import { useLogin } from '../../hooks/useLogin'

const emailContato = 'zera.interdisciplinar@gmail.com'

export default function LoginPage() {
  const { entrando, erro, paginaEstatica, formulario, erros, mostrarErro, bloqueio, aoEnviar, alterarCampo } = useLogin()

  return (
    <>
      <main className={estilos.pagina} id="conteudo" tabIndex={-1}>
        <aside className={estilos.marca} aria-label="Sobre o Zera">
          <div className={estilos.marcaCentral}>
            <Logo />
            <p className={estilos.tagline}>
              TRANSFORMANDO <span>DESCARTE</span>
              <br />EM <span>SOLUÇÃO</span>
            </p>
          </div>
          <address className={estilos.contatos}>
            <a href="https://www.instagram.com/zera.app_/" target="_blank" rel="noreferrer">
              <AtSign aria-hidden="true" />
              <span>@zera.app_</span>
            </a>
            <a href={`mailto:${emailContato}`}>
              <Mail aria-hidden="true" />
              <span>{emailContato}</span>
            </a>
          </address>
        </aside>
        <section className={estilos.painel} aria-labelledby="titulo-login">
          <div className={estilos.conteudoLogin}>
            <div className={estilos.marcaMobile}>
              <Logo />
            </div>
            <section className={estilos.cartao}>
              <h1 id="titulo-login">Entrar</h1>
              <p className={estilos.subtitulo}>Preencha seus dados para entrar na sua conta</p>
              <Formulario className={estilos.formulario} onSubmit={aoEnviar} noValidate>
                <FieldCard
                  id="email" obrigatorio
                  rotulo="Email"
                  tipo="email"
                  valor={formulario.email}
                  aoMudar={(valor) => alterarCampo('email', valor)}
                  erro={erros.email}
                  autoComplete="email"
                  maxLength={120}
                  placeholder="email@exemplo.com"
                  icone={<Mail aria-hidden="true" />}
                  modoLogin
                  autoFocus
                />

                <FieldCard
                  id="senha" obrigatorio
                  rotulo="Senha"
                  tipo="senha"
                  valor={formulario.senha}
                  aoMudar={(valor) => alterarCampo('senha', valor)}
                  erro={erros.senha}
                  autoComplete="current-password"
                  maxLength={128}
                  placeholder="Digite sua senha"
                  icone={<LockKeyhole aria-hidden="true" />}
                  modoLogin
                />

                {mostrarErro && erro && (
                  <p className={estilos.erroGeral} role="alert">
                    {erro}
                  </p>
                )}
                {mostrarErro && erro && paginaEstatica && <p>Se não conseguir entrar por esta versão, <a href="https://zera-web-app-kappa.vercel.app/login">acesse o Zera na Vercel</a> e tente novamente.</p>}

                {bloqueio.restante > 0 && (
                  <p className={estilos.contador} role="status" aria-live="polite">
                    Muitas tentativas seguidas. Tente novamente em {bloqueio.restante} s.
                  </p>
                )}

                <Link className={estilos.linkAuxiliar} to="/esqueci-senha">
                  Esqueci minha senha
                </Link>

                <Button
                  className={estilos.botaoEntrar}
                  variante="navy"
                  tamanho="grande"
                  type="submit"
                  disabled={entrando || bloqueio.restante > 0}
                >
                  {entrando ? 'Entrando…' : bloqueio.restante > 0 ? `Aguarde ${bloqueio.restante}s` : 'Entrar'}
                </Button>
              </Formulario>
            </section>
          </div>
        </section>
      </main>
    </>
  )
}
