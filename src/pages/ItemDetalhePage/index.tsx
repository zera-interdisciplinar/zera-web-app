import { Link, useParams } from 'react-router-dom'
import { DetalheItem } from '../../components/DetalheItem'
import { EmptyState } from '../../components/EmptyState'


export default function ItemDetalhePage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <EmptyState
        nivelTitulo="h1"
        titulo="Item não encontrado"
        descricao="O endereço não traz um identificador válido. Volte à lista de itens e tente novamente."
        acao={
          <Link to="/itens" className="link-botao">Voltar para itens</Link>
        }
      />
    )
  }

  return <DetalheItem key={id} produtoId={id} />
}
