import { Link } from 'react-router-dom'
import { SkipLink } from '../SkipLink'

export function NavegacaoPublica() {
  return <header className="cabecalho-publico">
    <SkipLink />
    <Link className="cabecalho-publico-logo" to="/login">
      <img src={`${import.meta.env.BASE_URL}assets/logo-zera.png`} alt="Zera" />
    </Link>
    <nav aria-label="Navegação de acesso">
      <Link to="/login">Entrar</Link>
      <Link to="/esqueci-senha">Recuperar acesso</Link>
    </nav>
  </header>
}
