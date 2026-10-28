import { DataTable } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { PageHeader } from '../../components/PageHeader'
import { RegistroDescarte } from '../../components/RegistroDescarte'
import { Skeleton } from '../../components/Skeleton'
import { useListaDescartes } from '../../hooks/useListaDescartes'
import type { DisposalResponse } from '../../types/apiReal'
import { formatarData } from '../../utils/formatacao'

const destinos = { RECYCLING: 'Reciclagem', LANDFILL: 'Aterro', DONATION: 'Doação' }

export default function DescartesPage() {
  const { usuario, modoDemonstracao, descartes } = useListaDescartes()

  return <>
    <PageHeader titulo="Registros de descarte" subtitulo="Consulte o destino, a data e o peso dos itens descartados." />
    {modoDemonstracao ? <EmptyState titulo="Nenhum descarte registrado" descricao="Os registros de descarte serão apresentados aqui quando estiverem disponíveis." /> : <>
      <RegistroDescarte aoConcluir={descartes.recarregar} />
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
        ...(usuario?.perfil !== 'funcionario' ? [{ titulo: 'Responsável', render: (item: DisposalResponse) => item.createdByName ?? 'Não informado' }] : []),
      ]} />}
    </>}
  </>
}
