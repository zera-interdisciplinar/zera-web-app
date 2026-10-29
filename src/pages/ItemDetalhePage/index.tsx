import { Link, useParams } from 'react-router-dom'
import { DetalheItem } from '../../components/DetalheItem'
import { EmptyState } from '../../components/EmptyState'
import { useAmbiente } from '../../hooks/useAmbiente'


export default function ItemDetalhePage() {
  const { modoDemonstracao } = useAmbiente()
  const { id } = useParams<{ id: string }>()

  if (!id || (modoDemonstracao && !Number.isFinite(Number(id)))) {
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

  return <DetalheItem key={id} produtoId={modoDemonstracao ? Number(id) : id} />
}
