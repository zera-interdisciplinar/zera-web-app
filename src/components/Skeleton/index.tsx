import type { SkeletonProps } from '../../types/componentes/Skeleton'
export type { SkeletonProps } from '../../types/componentes/Skeleton'
import estilos from '../../../styles/components/Skeleton/Skeleton.module.css'

export function Skeleton({ descricao, linhas = 4 }: SkeletonProps) {
  return (
    <div className={estilos.bloco} role="status" aria-live="polite">
      <span className="somente-leitor-de-tela">{descricao}</span>
      {Array.from({ length: linhas }, (_, indice) => `linha-${indice}`).map((chave) => (
        <span key={chave} className={estilos.linha} aria-hidden="true" />
      ))}
    </div>
  )
}
