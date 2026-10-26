import { useAuth } from '../../hooks/useAuth'
import { iniciais } from '../../types/usuario'
import { TopbarSlotOutlet } from '../../shared/ui/TopbarSlot'
import estilos from '../../../styles/components/Topbar/Topbar.module.css'

/** Barra superior do Figma: resumo contextual da página (slot) à esquerda e a identidade da conta à direita. */
export function Topbar() {
  const { usuario } = useAuth()
  return (
    <div className={estilos.topbar}>
      <TopbarSlotOutlet className={estilos.slot} />
      {usuario && <span className={estilos.avatar} role="img" aria-label={`Conta de ${usuario.nome}`}>{iniciais(usuario.nome)}</span>}
    </div>
  )
}
