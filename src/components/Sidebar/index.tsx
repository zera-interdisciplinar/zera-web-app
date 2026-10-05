import {
  Box,
  FileText,
  LayoutDashboard,
  Package,
  Recycle,
  Settings,
  Users,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usePermissoes } from '../../hooks/usePermissoes'
import { useAmbiente } from '../../hooks/useAmbiente'
import { iniciais, ROTULO_PERFIL } from '../../types/usuario'
import { NavItem } from '../NavItem'
import { UserCard } from '../UserCard'
import estilos from '../../../styles/components/Sidebar/Sidebar.module.css'

const DESTINOS = [
  { para: '/', rotulo: 'Dashboard', Icone: LayoutDashboard, exato: true },
  { para: '/itens', rotulo: 'Itens', Icone: Package, exato: false },
  { para: '/modelos', rotulo: 'Modelos', Icone: Box, exato: false },
  { para: '/recicladoras', rotulo: 'Recicladoras', Icone: Recycle, exato: false },
  { para: '/descartes', rotulo: 'Descartes', Icone: FileText, exato: false, permissao: 'consultarDescartes' },
  {
    para: '/funcionarios',
    rotulo: 'Funcionários',
    Icone: Users,
    exato: false,
    permissao: 'consultarUsuarios',
  },
  {
    para: '/relatorios',
    rotulo: 'Relatórios',
    Icone: FileText,
    exato: false,
    permissao: 'consultarRelatorios',
  },
  {
    para: '/configuracoes',
    rotulo: 'Configurações',
    Icone: Settings,
    exato: false,
    permissao: 'consultarConfiguracoes',
  },
] as const

export function Sidebar() {
  const { usuario } = useAuth()
  const permissoes = usePermissoes()
  const { modoDemonstracao } = useAmbiente()

  return (
    <aside className={`${estilos.sidebar} sobre-navy`}>
      <nav className={estilos.nav} aria-label="Seções do sistema">
        <ul className={estilos.lista}>
          {DESTINOS.filter(
            (destino) => permissoes.ler && (!('permissao' in destino) || permissoes[destino.permissao]),
          ).map((destino) => (
            <NavItem
              key={destino.para}
              para={destino.para}
              rotulo={destino.para === '/recicladoras' && !modoDemonstracao ? 'Locais de reciclagem' : destino.rotulo}
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
