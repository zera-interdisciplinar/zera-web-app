import { Skeleton } from '../Skeleton'
import { FeedbackPage } from '../FeedbackPage'

export function CarregandoPagina() {
  return (
    <FeedbackPage loading>
      <h1 className="somente-leitor-de-tela">Carregando a página</h1>
      <Skeleton descricao="Carregando a página." linhas={3} />
    </FeedbackPage>
  )
}
