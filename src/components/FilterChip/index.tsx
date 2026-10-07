import type { FilterChipProps } from '../../types/componentes/FilterChip'
export type { OpcaoFiltro, FilterChipProps } from '../../types/componentes/FilterChip'
import { useId } from 'react'

import { ChevronDown } from 'lucide-react'
import { useMenuSuspenso } from '../../hooks/useMenuSuspenso'
import estilos from '../../../styles/components/FilterChip/FilterChip.module.css'

export function FilterChip({
  rotulo,
  aparencia = 'pill',
  ativo = false,
  aoClicar,
  opcoes,
  valorAtual,
  aoSelecionar,
}: FilterChipProps) {
  const idMenu = useId()
  const { aberto, gatilhoRef, menuRef, alternar, aoTeclarMenu, fecharDevolvendoFoco } =
    useMenuSuspenso()

  if (!opcoes) {
    return (
      <button
        type="button"
        className={`${estilos.chip} ${estilos[aparencia]} ${ativo ? estilos.ativo : ''}`}
        aria-pressed={ativo}
        onClick={aoClicar}
      >
        {rotulo}
      </button>
    )
  }

  return (
    <span className={estilos.envoltorio}>
      <button
        type="button"
        className={`${estilos.chip} ${estilos[aparencia]}`}
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-controls={aberto ? idMenu : undefined}
        ref={gatilhoRef}
        onClick={alternar}
      >
        {rotulo}
        <ChevronDown size={16} aria-hidden="true" className={estilos.chevron} />
      </button>

      {aberto && (
        <ul
          className={estilos.menu}
          id={idMenu}
          role="menu"
          ref={menuRef}
          onKeyDown={aoTeclarMenu}
        >
          {opcoes.map((opcao) => (
            <li key={opcao.valor} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={valorAtual === opcao.valor}
                className={`${estilos.item} ${valorAtual === opcao.valor ? estilos.itemAtual : ''}`}
                onClick={() => {
                  aoSelecionar?.(opcao.valor)
                  fecharDevolvendoFoco()
                }}
              >
                {opcao.rotulo}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}
