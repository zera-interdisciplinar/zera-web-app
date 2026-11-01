import type { FeedbackPageProps } from '../../types/componentes/FeedbackPage'
import { NavegacaoPublica } from '../NavegacaoPublica'

/** Standalone loading and error states retain the page landmarks and a focusable content target. */
export function FeedbackPage({ children, loading }: FeedbackPageProps) {
  return (
    <><NavegacaoPublica />
      <main id="conteudo" tabIndex={-1} className="pagina-falha" data-carregando={loading || undefined}>{children}</main>
      <footer className="rodape-sistema">ZERA · Gestão de resíduos eletrônicos</footer>
    </>
  )
}
