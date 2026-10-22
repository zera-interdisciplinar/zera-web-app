import estilos from '../../../../styles/components/DashboardTabs/VisaoGeralTab.module.css'
import type { VisaoGeralTabProps } from '../../../types/componentes/VisaoGeralTab'
import { formatarNumero } from '../../../utils/formatarDashboard'
import { rotuloDashboard } from '../../../utils/rotulosDashboard'
import { GraficoDados } from '../../GraficoDados'
import { KpiDashboard } from '../../KpiDashboard'
import { Skeleton } from '../../Skeleton'
export function VisaoGeralTab({ snapshot, aguardando = true }: VisaoGeralTabProps) {
  if (!snapshot) return aguardando ? <Skeleton descricao="Preparando os dados…" linhas={4} /> : null
  const semDados = snapshot.kpis.itens_cadastrados.value === 0
    && snapshot.kpis.itens_cadastrados.change_percent === null
    && snapshot.kpis.aguardando_aprovacao.value === 0 && snapshot.kpis.aguardando_aprovacao.prioritarios === 0
    && snapshot.kpis.impacto_recuperado.kg === 0 && snapshot.kpis.impacto_recuperado.tonnes === 0
    && snapshot.kpis.taxa_reciclagem.percent === null && snapshot.kpis.taxa_reciclagem.change_points === null
    && snapshot.circularidade.percent === null && snapshot.alertas.abertos === 0
    && snapshot.alertas.por_gravidade.every(p => p.quantidade === 0)
    && snapshot.por_categoria.length === 0 && snapshot.por_status.length === 0
    && snapshot.itens_por_mes.every(p => p.cadastrados === 0 && p.encaminhados === 0)
  return <div className={estilos.conteudo}>
    {semDados && <p role="status">Ainda não há dados para exibir. Os indicadores de movimentações não receberam dados.</p>}
    <p>Os indicadores de movimentações abaixo seguem os filtros selecionados.</p>
    <section className={estilos.gradeKpis} aria-label="Indicadores gerais">
      <KpiDashboard titulo="Alertas registrados" valor={formatarNumero(snapshot.alertas.abertos)} />
      <KpiDashboard titulo="Circularidade (%)" valor={formatarNumero(snapshot.circularidade.percent, 2)} />
    </section>
    <section className={estilos.gradeGraficos} aria-label="Gráficos de visão geral">
      <GraficoDados titulo="Encaminhamentos por mês" eixo="Mês" unidade="itens" vazio="Nenhum encaminhamento contabilizado neste período." pontos={snapshot.itens_por_mes.map(p => ({ rotulo: p.mes, valor: p.encaminhados }))} />
      <GraficoDados titulo="Alertas por gravidade" eixo="Gravidade" unidade="alertas" vazio="Nenhum alerta aberto neste período." pontos={snapshot.alertas.por_gravidade.map(p => ({ rotulo: rotuloDashboard(p.gravidade), valor: p.quantidade }))} />
    </section>
  </div>
}
