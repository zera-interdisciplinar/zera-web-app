import type { ButtonHTMLAttributes, ReactNode } from 'react'
import estilos from './Button.module.css'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'navy' | 'secundario' | 'perigo'
  tamanho?: 'padrao' | 'grande'
  children: ReactNode
}

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
