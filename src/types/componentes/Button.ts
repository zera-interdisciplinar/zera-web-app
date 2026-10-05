import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'navy' | 'secundario' | 'perigo'
  tamanho?: 'padrao' | 'grande'
  children: ReactNode
}
