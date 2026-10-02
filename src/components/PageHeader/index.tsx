import estilos from './PageHeader.module.css'

export interface PageHeaderProps {
  titulo: string
  subtitulo: string
}

export function PageHeader({ titulo, subtitulo }: PageHeaderProps) {
  return (
    <header className={estilos.cabecalho}>
      <h1 className="titulo-pagina">{titulo}</h1>
      <p className={estilos.subtitulo}>{subtitulo}</p>
    </header>
  )
}
