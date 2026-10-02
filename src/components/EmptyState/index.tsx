import type { ReactNode } from 'react'
import estilos from './EmptyState.module.css'

export interface EmptyStateProps {
  titulo: string
  descricao: string
  acao?: ReactNode
  nivelTitulo?: 'h1' | 'h2'
}

export function EmptyState({ titulo, descricao, acao, nivelTitulo: Titulo = 'h2' }: EmptyStateProps) {
  return (
    <div className={estilos.bloco}>
      <Titulo className={estilos.titulo}>{titulo}</Titulo>
      <p className={estilos.descricao}>{descricao}</p>
      {acao && <div className={estilos.acao}>{acao}</div>}
    </div>
  )
}
