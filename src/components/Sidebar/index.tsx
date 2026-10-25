import { Box, LayoutDashboard, Package } from 'lucide-react'
import { navigationItems } from '../../app/navigation'
import { useAuth } from '../../hooks/useAuth'
import { usePermissoes } from '../../hooks/usePermissoes'
import { iniciais, ROTULO_PERFIL } from '../../types/usuario'
import { NavItem } from '../NavItem'
import { UserCard } from '../UserCard'
import estilos from '../../../styles/components/Sidebar/Sidebar.module.css'

const ICONES = { '/': LayoutDashboard, '/itens': Package, '/modelos': Box } as const
const DESTINOS = navigationItems.map((item) => ({ para: item.path, rotulo: item.label, Icone: ICONES[item.path as keyof typeof ICONES], exato: item.exact }))

export function Sidebar() {
  const { usuario } = useAuth()
  const permissoes = usePermissoes()

  return (
    <aside className={`${estilos.sidebar} sobre-navy`}>
      <nav className={estilos.nav} aria-label="Seções do sistema">
        <ul className={estilos.lista}>
          {DESTINOS.filter(() => permissoes.ler).map((destino) => (
            <NavItem
              key={destino.para}
              para={destino.para}
              rotulo={destino.rotulo}
              Icone={destino.Icone}
              exato={destino.exato}
            />
          ))}
        </ul>
      </nav>

      {usuario && (
        <div className={estilos.rodape}>
          <UserCard
            nome={usuario.nome}
            cargo={usuario.cargo ?? ROTULO_PERFIL[usuario.perfil]}
            iniciais={iniciais(usuario.nome)}
          />
        </div>
      )}
    </aside>
  )
}
