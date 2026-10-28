import { VisaoGeralTab } from '../DashboardTabs/VisaoGeralTab'
import { ItensVidaUtilTab } from '../DashboardTabs/ItensVidaUtilTab'
import { EvolucaoMovimentacoesTab } from '../DashboardTabs/EvolucaoMovimentacoesTab'
import { QualidadeDadosTab } from '../DashboardTabs/QualidadeDadosTab'
import { MateriaisSustentabilidadeTab } from '../DashboardTabs/MateriaisSustentabilidadeTab'
import { dashboardSnapshotMock } from '../../mocks/dashboardSseFixture'

export function DashboardDemo() {
  return <main id="conteudo" data-estado="sucesso" style={{ padding: '1.5rem' }}>
    <h1>Painel de demonstração</h1>
    <p role="status">DADOS DE DEMONSTRAÇÃO: API de analytics indisponível neste ambiente.</p>
    <VisaoGeralTab snapshot={dashboardSnapshotMock} demo />
    <ItensVidaUtilTab demo /><EvolucaoMovimentacoesTab demo /><QualidadeDadosTab demo /><MateriaisSustentabilidadeTab demo />
  </main>
}
