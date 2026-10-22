import estilos from '../../../../styles/components/DashboardTabs/EvolucaoMovimentacoesTab.module.css'
import type { EvolucaoMovimentacoesTabProps } from '../../../types/componentes/EvolucaoMovimentacoesTab'
import { DataTable } from '../../DataTable'
import { GraficoDados } from '../../GraficoDados'
import { Skeleton } from '../../Skeleton'

export function EvolucaoMovimentacoesTab({ snapshot = null, aguardando = false }: EvolucaoMovimentacoesTabProps = {}) {
  if (!snapshot && aguardando) return <Skeleton descricao="Preparando os dados…" linhas={3} />
  return (
    <section className={estilos.sourceState} aria-labelledby="fonte-evolucao">
      <h2 id="fonte-evolucao">Evolução e movimentações</h2>
      {snapshot && snapshot.itens_por_mes.length > 0 ? <DataTable
        legenda="Encaminhamentos por mês" dados={snapshot.itens_por_mes} chave={(ponto) => ponto.mes}
        colunas={[
          { titulo: 'Mês', numerica: true, render: (ponto) => ponto.mes },
          { titulo: 'Encaminhados', numerica: true, render: (ponto) => ponto.encaminhados },
        ]}
      /> : <p>Ainda não há dados para exibir aqui.</p>}
      {snapshot && <GraficoDados titulo="Encaminhamentos por mês" eixo="Mês" unidade="itens" vazio="Nenhum encaminhamento contabilizado neste período." pontos={snapshot.itens_por_mes.map(p => ({ rotulo: p.mes, valor: p.encaminhados }))} />}
      <p>Encaminhamentos informados pela origem de movimentações. O histórico detalhado de eventos ainda não está disponível.</p>
    </section>
  )
}
