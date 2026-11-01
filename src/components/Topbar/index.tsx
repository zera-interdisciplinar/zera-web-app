import { useAuth } from '../../hooks/useAuth'
import { UserCard } from '../UserCard'
import { iniciais, ROTULO_PERFIL } from '../../types/usuario'
import { TopbarSlotOutlet } from '../TopbarSlotOutlet'
import estilos from '../../../styles/components/Topbar/Topbar.module.css'

/** Barra superior do Figma: resumo contextual da página (slot) à esquerda e a identidade da conta à direita. */
export function Topbar() {
  const { usuario } = useAuth()
  return (
    <div className={estilos.topbar}>
      <TopbarSlotOutlet className={estilos.slot} />
      {usuario && <>
        <span className={`${estilos.avatar} ${estilos.desktopAvatar}`} role="img" aria-label={`Conta de ${usuario.nome}`}>{iniciais(usuario.nome)}</span>
        <div className={estilos.mobileAccount}><UserCard compact nome={usuario.nome} cargo={usuario.cargo ?? ROTULO_PERFIL[usuario.perfil]} iniciais={iniciais(usuario.nome)} /></div>
      </>}
    </div>
  )
}
