import estilos from './Skeleton.module.css'

export interface SkeletonProps {
  descricao: string
  linhas?: number
}

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
