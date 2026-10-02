import type { ReactNode } from 'react'
import estilos from './IconButton.module.css'

export interface IconButtonProps {
  rotulo: string
  onClick: () => void
  children: ReactNode
}

export function IconButton({ rotulo, onClick, children }: IconButtonProps) {
  return (
    <button type="button" className={estilos.botao} aria-label={rotulo} onClick={onClick}>
      {children}
    </button>
  )
}
