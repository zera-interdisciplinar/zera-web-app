import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { FieldCard } from '../../components/FieldCard'
import { Logo } from '../../components/Logo'
import { useAuth } from '../../hooks/useAuth'
import type { Credenciais } from '../../types/usuario'
import { validarCredenciais } from '../../utils/validacao'
import type { ErrosDeCampo } from '../../utils/validacao'
import estilos from './LoginPage.module.css'
import { modoDemonstracao } from '../../services/apiReal'
import { SkipLink } from '../../components/SkipLink'

export default function LoginPage() {
  const { entrar, entrando, erro, autenticado } = useAuth()
  const navegar = useNavigate()

  const [formulario, setFormulario] = useState<Credenciais>({ email: '', senha: '' })
  const [erros, setErros] = useState<ErrosDeCampo<Credenciais>>({})

  useEffect(() => {
    if (autenticado) navegar('/', { replace: true })
  }, [autenticado, navegar])

  async function aoEnviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const validacao = validarCredenciais(formulario)
    setErros(validacao.erros)
    if (!validacao.valido) return

    const entrou = await entrar(validacao.dados)
    if (entrou) navegar('/', { replace: true })
  }

  return (
    <>
    <SkipLink />
    <main className={estilos.pagina} id="conteudo" tabIndex={-1}>

      <aside className={`${estilos.marca} sobre-navy`} aria-label="Sobre o Zera">
        <div className={estilos.marcaTopo}>
          <div className={estilos.wordmark}>
            <Logo tom="claro" />
          </div>
          <p className={estilos.tagline}>
            Gestão de resíduos eletrônicos. Cada triagem, descarte e envio a cooperativa
            fica registrado no seu nome.
          </p>
        </div>

        <div className={estilos.marcaRodape}>
          <Logo variante="marca" />
        </div>
      </aside>

      <section className={estilos.painel} aria-labelledby="titulo-login">
        <h1 className="titulo-pagina" id="titulo-login">
          Entrar no Zera
        </h1>
        <p className={estilos.subtitulo}>Use o e-mail corporativo cadastrado pelo administrador.</p>
        {modoDemonstracao && <p className="aviso-demo" role="status">Demonstração local com dados simulados.</p>}

        <form className={estilos.formulario} onSubmit={aoEnviar} noValidate>
          <FieldCard
            id="email"
            rotulo="E-mail"
            tipo="email"
            valor={formulario.email}
            aoMudar={(valor) => setFormulario((atual) => ({ ...atual, email: valor }))}
            erro={erros.email}
            autoComplete="username"
            maxLength={120}
            placeholder="nome@empresa.com"
          />

          <FieldCard
            id="senha"
            rotulo="Senha"
            tipo="senha"
            valor={formulario.senha}
            aoMudar={(valor) => setFormulario((atual) => ({ ...atual, senha: valor }))}
            erro={erros.senha}
            autoComplete="current-password"
            maxLength={64}
            placeholder="Mínimo 6 caracteres"
          />

          {erro && (
            <p className={estilos.erroGeral} role="alert">
              {erro}
            </p>
          )}

          <Button variante="navy" tamanho="grande" type="submit" disabled={entrando}>
            {entrando ? 'Verificando…' : 'Entrar'}
          </Button>

          <p className={estilos.aviso} aria-live="polite">
            {entrando ? 'Conferindo credenciais no servidor.' : ''}
          </p>
        </form>
      </section>
    </main>
    </>
  )
}
