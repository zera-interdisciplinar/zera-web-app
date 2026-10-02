import type { MouseEvent } from 'react'

function irParaConteudo(evento: MouseEvent<HTMLAnchorElement>) {
  evento.preventDefault()
  const conteudo = document.getElementById('conteudo')
  conteudo?.focus({ preventScroll: true })
  conteudo?.scrollIntoView({ block: 'start' })
}

export function SkipLink() {
  return <a className="pular-para-conteudo" href="#conteudo" onClick={irParaConteudo}>Pular para o conteúdo</a>
}
