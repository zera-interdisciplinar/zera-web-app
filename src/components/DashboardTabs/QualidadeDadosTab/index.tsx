import estilos from '../../../../styles/components/DashboardTabs/QualidadeDadosTab.module.css'
import type { QualidadeDadosTabProps } from '../../../types/componentes/QualidadeDadosTab'
import { DataTable } from '../../DataTable'
import { GraficoDados } from '../../GraficoDados'
import { Skeleton } from '../../Skeleton'
import { SeloDemonstracao } from '../SeloDemonstracao'

const gravidades: Record<string, string> = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa', CRITICAL: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa', critical: 'Crítica' }

export function QualidadeDadosTab({ demo = false, snapshot = null, aguardando = false }: QualidadeDadosTabProps = {}) {
  if (!snapshot && aguardando) return <Skeleton descricao="Preparando os dados…" linhas={3} />
  return (
    <section className={estilos.semFonte} aria-labelledby="fonte-qualidade">
      <h2 id="fonte-qualidade">Qualidade dos dados e alertas</h2>
      {demo && <SeloDemonstracao />}
      {snapshot ? <>
        <p>Alertas abertos: <strong>{snapshot.alertas.abertos}</strong></p>
        <GraficoDados demo={demo} titulo="Alertas por gravidade" eixo="Gravidade" unidade="alertas" vazio="Nenhum alerta aberto neste período." pontos={snapshot.alertas.por_gravidade.map(p => ({ rotulo: gravidades[p.gravidade] ?? 'Não informada', valor: p.quantidade }))} />
        {snapshot.alertas.por_gravidade.length > 0 && <DataTable
          legenda="Alertas por gravidade" dados={snapshot.alertas.por_gravidade} chave={(ponto) => ponto.gravidade}
          colunas={[
            { titulo: 'Gravidade', render: (ponto) => gravidades[ponto.gravidade] ?? 'Não informada' },
            { titulo: 'Quantidade', numerica: true, render: (ponto) => ponto.quantidade },
          ]}
        />}
      </> : <p>Ainda não há dados para exibir aqui.</p>}
      <p>Os indicadores de preenchimento e resolução de alertas ainda não estão disponíveis.</p>
    </section>
  )
}
