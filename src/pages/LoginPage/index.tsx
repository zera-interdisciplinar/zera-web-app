import { useEffect, useState } from 'react'
import { AtSign, LockKeyhole, Mail, MessageCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { FieldCard } from '../../components/FieldCard'
import { Logo } from '../../components/Logo'
import { SkipLink } from '../../components/SkipLink'
import { useAuth } from '../../hooks/useAuth'
import type { Credenciais } from '../../types/usuario'
import { validarCredenciais } from '../../utils/validacao'
import type { ErrosDeCampo } from '../../utils/validacao'
import estilos from '../../../styles/pages/LoginPage/LoginPage.module.css'

const emailContato = 'zera.institutojef@gmail.com'

interface EstadoBloqueio {
  falhas: number
  bloqueadoAte: number
  restante: number
}

export default function LoginPage() {
  const { entrar, entrando, erro, autenticado } = useAuth()
  const navegar = useNavigate()
  const [formulario, setFormulario] = useState<Credenciais>({ email: '', senha: '' })
  const [erros, setErros] = useState<ErrosDeCampo<Credenciais>>({})
  const [mostrarErro, setMostrarErro] = useState(false)
  const [bloqueio, setBloqueio] = useState<EstadoBloqueio>({ falhas: 0, bloqueadoAte: 0, restante: 0 })

  useEffect(() => {
    if (autenticado) navegar('/', { replace: true })
  }, [autenticado, navegar])

  useEffect(() => {
    if (!bloqueio.bloqueadoAte) return
    const atualizarContador = () => {
      const restante = Math.max(0, Math.ceil((bloqueio.bloqueadoAte - Date.now()) / 1000))
      setBloqueio((atual) => {
        if (restante === 0) return { falhas: 0, bloqueadoAte: 0, restante: 0 }
        return atual.restante === restante ? atual : { ...atual, restante }
      })
    }
    atualizarContador()
    const temporizador = window.setInterval(atualizarContador, 200)
    return () => window.clearInterval(temporizador)
  }, [bloqueio.bloqueadoAte])

  async function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (entrando || bloqueio.restante > 0) return

    setMostrarErro(false)
    const validacao = validarCredenciais(formulario)
    setErros(validacao.erros)
    if (!validacao.valido) {
      const primeiroCampo = Object.keys(validacao.erros)[0]
      if (primeiroCampo) document.getElementById(primeiroCampo)?.focus()
      return
    }

    const resultado = await entrar(validacao.dados)
    if (resultado === 'autenticado') {
      setBloqueio({ falhas: 0, bloqueadoAte: 0, restante: 0 })
      navegar('/', { replace: true })
      return
    }

    setMostrarErro(true)
    setErros({})
    setFormulario({ email: '', senha: '' })
    requestAnimationFrame(() => document.getElementById('email')?.focus())
    if (resultado === 'credenciais-invalidas') {
      setBloqueio((atual) => {
        const falhas = atual.falhas + 1
        return falhas >= 3
          ? { falhas: 0, bloqueadoAte: Date.now() + 3000, restante: 3 }
          : { ...atual, falhas }
      })
    } else {
      setBloqueio((atual) => ({ ...atual, falhas: 0 }))
    }
  }

  function alterarCampo(campo: keyof Credenciais, valor: string) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
    setMostrarErro(false)
    setErros((atuais) => ({ ...atuais, [campo]: undefined }))
  }

  return (
    <>
      <SkipLink />
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
            <a href="https://www.instagram.com/zera.app/" target="_blank" rel="noreferrer">
              <AtSign aria-hidden="true" />
              <span>@zera.app</span>
            </a>
            <a href="tel:+5511933045181">
              <MessageCircle aria-hidden="true" />
              <span>+55 (11) 93304-5181</span>
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

              <form className={estilos.formulario} onSubmit={aoEnviar} noValidate>
                <FieldCard
                  id="email"
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
                  id="senha"
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

                {bloqueio.restante > 0 && (
                  <p className={estilos.contador} role="status" aria-live="polite">
                    Muitas tentativas seguidas. Tente novamente em {bloqueio.restante} s.
                  </p>
                )}

                <a className={estilos.linkAuxiliar} href={`mailto:${emailContato}?subject=Recuperar%20acesso%20ao%20Zera`}>
                  Esqueci minha senha
                </a>

                <Button
                  className={estilos.botaoEntrar}
                  variante="navy"
                  tamanho="grande"
                  type="submit"
                  disabled={entrando || bloqueio.restante > 0}
                >
                  {entrando ? 'Entrando…' : bloqueio.restante > 0 ? `Aguarde ${bloqueio.restante}s` : 'Entrar'}
                </Button>
              </form>
            </section>
          </div>
        </section>
      </main>
    </>
  )
}
