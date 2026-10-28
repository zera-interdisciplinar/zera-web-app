import { SeloDemonstracao } from './SeloDemonstracao'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from '../../../styles/components/DashboardTabs/MateriaisSustentabilidadeTab.module.css'
import { useMateriaisDashboard } from '../../hooks/useDadosInventarioDashboard'
import { DataTable } from '../DataTable'
import { EstadoErro } from '../EstadoErro'
import { formatarNumero } from '../../utils/formatarDashboard'
import { GraficoDados } from '../GraficoDados'

const materiais: Record<string, string> = { PLASTIC: 'Plástico', METAL: 'Metal', GLASS: 'Vidro', PAPER: 'Papel', BATTERY: 'Bateria', CIRCUIT_BOARD: 'Placa de circuito', CABLE: 'Cabo', SCREEN: 'Tela', OTHER: 'Outro' }

export function MateriaisSustentabilidadeTab({ demo = false, ativo = false }: { demo?: boolean; filtros?: FiltrosDashboard; ativo?: boolean } = {}) {
  const indicadores = useMateriaisDashboard(ativo)
  const pontos = indicadores.dados?.weightByMaterial
  return (
    <section className={estilos.semFonte} aria-labelledby="fonte-materiais" data-estado={indicadores.carregando ? 'carregando' : indicadores.erro ? 'erro' : 'sucesso'}>
      <h2 id="fonte-materiais">Materiais e sustentabilidade</h2>
      {demo && <SeloDemonstracao />}
      {indicadores.carregando && <p role="status">Carregando materiais descartados…</p>}
      {indicadores.erro && <EstadoErro mensagem={indicadores.erro} aoTentarNovamente={indicadores.recarregar} />}
      {pontos && pontos.length > 0 ? <DataTable legenda="Peso descartado por material" dados={pontos} chave={(ponto) => ponto.material}
        colunas={[
          { titulo: 'Material', render: (ponto) => materiais[ponto.material] ?? 'Não informado' },
          { titulo: 'Peso (kg)', numerica: true, render: (ponto) => formatarNumero(ponto.weightKg, 2) },
          { titulo: 'Participação (%)', numerica: true, render: (ponto) => formatarNumero(ponto.percent, 2) },
        ]}
      /> : !indicadores.carregando && !indicadores.erro && <p>Ainda não há dados para exibir aqui.</p>}
      {pontos && <GraficoDados titulo="Peso descartado por material" eixo="Material" unidade="kg" vazio="Nenhum peso descartado por material foi registrado neste período." pontos={pontos.map(p => ({ rotulo: materiais[p.material] ?? 'Não informado', valor: p.weightKg }))} />}
      <p>Os valores representam descartes registrados na unidade, sem os filtros da visão geral.</p>
    </section>
  )
}
