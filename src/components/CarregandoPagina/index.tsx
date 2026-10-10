import { Skeleton } from '../Skeleton'
import { NavegacaoPublica } from '../NavegacaoPublica'

export function CarregandoPagina() {
  return (
    <>
    <NavegacaoPublica />
    <main id="conteudo" tabIndex={-1} data-carregando style={{ padding: 'var(--sp-8)' }}>
      <h1 className="somente-leitor-de-tela">Carregando a página</h1>
      <Skeleton descricao="Carregando a página." linhas={3} />
    </main>
    </>
  )
}
