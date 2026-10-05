import type { UserCardProps } from '../../types/componentes/UserCard'
export type { UserCardProps } from '../../types/componentes/UserCard'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useMenuSuspenso } from '../../hooks/useMenuSuspenso'
import { ROTULO_PERFIL } from '../../types/usuario'
import estilos from '../../../styles/components/UserCard/UserCard.module.css'

export function UserCard({ nome, cargo, iniciais: sigla }: UserCardProps) {
  const { usuario, sair } = useAuth()
  const navegar = useNavigate()
  const {
    aberto,
    gatilhoRef,
    menuRef,
    alternar,
    fechar,
    aoTeclarMenu,
  } = useMenuSuspenso()

  function encerrarSessao() {
    fechar()
    sair()
    navegar('/login')
  }

  return (
    <div className={estilos.envoltorio}>
      <button
        type="button"
        className={estilos.cartao}
        ref={gatilhoRef}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? 'menu-perfil-sidebar' : undefined}
        aria-label={`Perfil de ${nome}`}
        onClick={alternar}
      >
        <span className={estilos.avatar} aria-hidden="true">
          {sigla}
        </span>
        <span className={estilos.identidade}>
          <span className={estilos.nome}>{nome}</span>
          <span className={estilos.cargo}>{cargo}</span>
        </span>
      </button>

      {aberto && usuario && (
        <ul
          className={estilos.menu}
          id="menu-perfil-sidebar"
          role="menu"
          ref={menuRef}
          onKeyDown={aoTeclarMenu}
        >
          <li role="none" className={estilos.menuInfo}>
            <span className={estilos.menuAvatar} aria-hidden="true">
              {sigla}
            </span>
            <span className={estilos.menuIdentidade}>
              <span className={estilos.menuNome}>{usuario.nome}</span>
              <span className={estilos.menuCargo}>
                {(usuario.cargo ?? ROTULO_PERFIL[usuario.perfil])} · {usuario.unidade}
              </span>
              <span className={estilos.menuEmail}>{usuario.email}</span>
            </span>
          </li>
          <li role="none">
            <button type="button" role="menuitem" className={estilos.menuAcao} onClick={encerrarSessao}>
              Encerrar sessão
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
