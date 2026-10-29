import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { FluxoTriagem } from '../../components/FluxoTriagem'
import { useAmbiente } from '../../hooks/useAmbiente'

export default function TriagemPage() {
  const { modoDemonstracao } = useAmbiente()
  const { id } = useParams<{ id: string }>()

  if (!id || (modoDemonstracao && Number.isNaN(Number(id)))) {
    return (
      <EmptyState
        nivelTitulo="h1"
        titulo="Item não encontrado"
        descricao="O endereço não traz um identificador válido. Abra a triagem a partir da ficha do item."
        acao={
          <Link to="/itens" className="link-botao">Voltar para itens</Link>
        }
      />
    )
  }

  if (!modoDemonstracao) {
    return <EmptyState nivelTitulo="h1" titulo="Avaliação do item" descricao="Abra os detalhes do item para avaliar sua condição e acompanhar as etapas de aprovação." acao={<Link to={`/itens/${id}`} className="link-botao">Voltar para o item</Link>} />
  }
  return <FluxoTriagem key={id} produtoId={Number(id)} />
}
