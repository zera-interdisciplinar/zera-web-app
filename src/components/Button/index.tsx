import type { ButtonProps } from '../../types/componentes/Button'
export type { ButtonProps } from '../../types/componentes/Button'

import estilos from '../../../styles/components/Button/Button.module.css'

export function Button({
  variante = 'primario',
  tamanho = 'padrao',
  type = 'button',
  className,
  children,
  ...resto
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${estilos.botao} ${estilos[variante]} ${estilos[tamanho]} ${className ?? ''}`}
      {...resto}
    >
      {children}
    </button>
  )
}
