import type { PageHeaderProps } from '../../types/componentes/PageHeader'
export type { PageHeaderProps } from '../../types/componentes/PageHeader'
import estilos from '../../../styles/components/PageHeader/PageHeader.module.css'

export function PageHeader({ titulo, subtitulo }: PageHeaderProps) {
  return (
    <header className={estilos.cabecalho}>
      <h1 className="titulo-pagina">{titulo}</h1>
      <p className={estilos.subtitulo}>{subtitulo}</p>
    </header>
  )
}
