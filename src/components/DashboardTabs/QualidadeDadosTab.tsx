import { SeloDemonstracao } from './SeloDemonstracao'
import type { DashboardSnapshot, FiltrosDashboard } from '../../types/dashboardAnalytics'
import { DataTable } from '../DataTable'
import estilos from '../../../styles/components/DashboardTabs/QualidadeDadosTab.module.css'

const gravidades: Record<string, string> = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa', CRITICAL: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa', critical: 'Crítica' }

export function QualidadeDadosTab({ demo = false, snapshot = null }: { demo?: boolean; filtros?: FiltrosDashboard; snapshot?: DashboardSnapshot | null } = {}) {
  return (
    <section className={estilos.semFonte} aria-labelledby="fonte-qualidade">
      <h2 id="fonte-qualidade">Qualidade dos dados e alertas</h2>
      {demo && <SeloDemonstracao />}
      {snapshot ? <>
        <p>Alertas abertos: <strong>{snapshot.alertas.abertos}</strong></p>
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
