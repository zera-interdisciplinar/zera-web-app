import { Outlet } from 'react-router-dom'
import { Logo } from '../Logo'
import { Sidebar } from '../Sidebar'
import { Topbar } from '../Topbar'
import estilos from '../../../styles/components/AppShell/AppShell.module.css'
import { useAmbiente } from '../../hooks/useAmbiente'
import { SkipLink } from '../SkipLink'

export function AppShell() {
  const { modoDemonstracao } = useAmbiente()
  return (
    <div className={estilos.shell}>
      <SkipLink />

      <header className={estilos.cabecalho}>
        <div className={estilos.marca}>
          <Logo />
        </div>
        <Topbar />
      </header>

      <Sidebar />
      <div className={estilos.coluna}>
        <main className={estilos.conteudo} id="conteudo" tabIndex={-1}>
          {modoDemonstracao && <p className="aviso-demo" role="status">Demonstração com dados fictícios. As alterações são reiniciadas ao recarregar.</p>}
          <Outlet />
        </main>
      </div>
    </div>
  )
}
