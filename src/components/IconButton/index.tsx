import type { IconButtonProps } from '../../types/componentes/IconButton'
export type { IconButtonProps } from '../../types/componentes/IconButton'

import estilos from '../../../styles/components/IconButton/IconButton.module.css'

export function IconButton({ rotulo, onClick, children }: IconButtonProps) {
  return (
    <button type="button" className={estilos.botao} aria-label={rotulo} onClick={onClick}>
      {children}
    </button>
  )
}
