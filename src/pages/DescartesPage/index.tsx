import { useCallback } from 'react'
import { DataTable } from '../../components/DataTable'
import { PageHeader } from '../../components/PageHeader'
import { Skeleton } from '../../components/Skeleton'
import { EstadoErro } from '../../components/EstadoErro'
import { EmptyState } from '../../components/EmptyState'
import { useRequisicao } from '../../hooks/useRequisicao'
import { listarDescartes } from '../../services/cicloService'
import { modoDemonstracao } from '../../services/apiReal'
import type { DisposalResponse } from '../../types/apiReal'
import { formatarData } from '../../utils/formatacao'

const destinos = { RECYCLING: 'Reciclagem', LANDFILL: 'Aterro', DONATION: 'Doação' }

export default function DescartesPage() {
  const buscar = useCallback((sinal: AbortSignal) => listarDescartes(sinal), [])
  const descartes = useRequisicao<DisposalResponse[]>(buscar, !modoDemonstracao)
  return <>
    <PageHeader titulo="Registros de descarte" subtitulo="Destinações registradas no inventário. Esta consulta não representa envio de relatórios." />
    {modoDemonstracao ? <EmptyState titulo="Consulta disponível na API real" descricao="Esta tela consulta os registros documentados de descarte. Não há fixture para esta consulta." /> : <>
      {descartes.carregando && <Skeleton descricao="Carregando os descartes." linhas={3} />}
      {descartes.erro && <EstadoErro mensagem={descartes.erro} aoTentarNovamente={descartes.recarregar} />}
      {descartes.dados && <p role="status">{descartes.dados.length} registros encontrados.</p>}
      {descartes.dados && descartes.dados.length === 0 && <EmptyState titulo="Nenhum descarte registrado" descricao="A unidade não retornou registros de descarte." />}
      {descartes.dados && descartes.dados.length > 0 && <DataTable dados={descartes.dados} chave={(item) => item.id} legenda="Descartes, destinos, quantidades e pesos" colunas={[
        { titulo: 'Data', render: (item) => formatarData(item.disposedAt) },
        { titulo: 'Destino', render: (item) => destinos[item.destination] },
        { titulo: 'Local', render: (item) => item.placeName ?? 'Não informado' },
        { titulo: 'Itens', render: (item) => item.items.length, numerica: true },
        { titulo: 'Peso (kg)', render: (item) => item.totalWeightKg.toLocaleString('pt-BR'), numerica: true },
        { titulo: 'Responsável', render: (item) => item.createdByName ?? 'Não informado' },
      ]} />}
    </>}
  </>
}
