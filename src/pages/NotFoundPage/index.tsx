import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { Logo } from '../../components/Logo'
import estilos from './NotFoundPage.module.css'

export default function NotFoundPage() {
  const navegar = useNavigate()

  return (
    <><a className="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a><main className={estilos.pagina} id="conteudo" tabIndex={-1}>
      <section className={estilos.cartao} aria-labelledby="titulo-404">
        <Logo variante="marca" />
        <h1 className="titulo-pagina" id="titulo-404">
          Página não encontrada
        </h1>
        <p className={estilos.texto}>
          O endereço pode ter sido digitado errado ou o item foi removido do inventário. Se você
          chegou aqui por um código de barras, confira a etiqueta e tente de novo pela lista de
          itens.
        </p>
        <div className={estilos.acoes}>
          <Button variante="primario" onClick={() => navegar('/')}>
            Voltar ao início
          </Button>
        </div>
      </section>
    </main></>
  )
}
