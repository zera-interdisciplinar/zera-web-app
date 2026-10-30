import { Link } from 'react-router-dom'
import { SkipLink } from '../SkipLink'

export function NavegacaoPublica() {
  return <header className="cabecalho-publico">
    <SkipLink />
    <span>ZERA</span>
    <nav aria-label="Navegação de acesso">
      <Link to="/login">Entrar</Link>
      <Link to="/esqueci-senha">Recuperar acesso</Link>
    </nav>
  </header>
}
