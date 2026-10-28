import type { EmptyStateProps } from '../../types/componentes/EmptyState'
export type { EmptyStateProps } from '../../types/componentes/EmptyState'

import estilos from '../../../styles/components/EmptyState/EmptyState.module.css'

export function EmptyState({ titulo, descricao, acao, nivelTitulo: Titulo = 'h2' }: EmptyStateProps) {
  return (
    <div className={estilos.bloco}>
      <Titulo className={estilos.titulo}>{titulo}</Titulo>
      <p className={estilos.descricao}>{descricao}</p>
      {acao && <div className={estilos.acao}>{acao}</div>}
    </div>
  )
}
