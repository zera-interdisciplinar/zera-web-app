import estilos from '../../../../styles/components/DashboardTabs/VisaoGeralTab.module.css'
import type { VisaoGeralTabProps } from '../../../types/componentes/VisaoGeralTab'
import { formatarNumero, formatarPontosPercentuais, formatarVariacao } from '../../../utils/formatarDashboard'
import { rotuloDashboard } from '../../../utils/rotulosDashboard'
import { DonutChart } from '../../DonutChart'
import { GraficoDados } from '../../GraficoDados'
import { KpiDashboard } from '../../KpiDashboard'
import { Skeleton } from '../../Skeleton'
import { SeloDemonstracao } from '../SeloDemonstracao'
export function VisaoGeralTab({ snapshot, demo = false, aguardando = true }: VisaoGeralTabProps) {
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
    {semDados && <p role="status">Ainda não há dados para exibir.</p>}
    <section className={estilos.gradeKpis} aria-label="Indicadores gerais">
      <KpiDashboard demo={demo} titulo="Itens cadastrados" valor={formatarNumero(snapshot.kpis.itens_cadastrados.value)} nota={formatarVariacao(snapshot.kpis.itens_cadastrados.change_percent)} />
      <KpiDashboard demo={demo} titulo="Alertas registrados" valor={formatarNumero(snapshot.alertas.abertos)} />
      <KpiDashboard demo={demo} titulo="Taxa de reciclagem (%)" valor={formatarNumero(snapshot.kpis.taxa_reciclagem.percent, 2)} nota={`Variação: ${formatarPontosPercentuais(snapshot.kpis.taxa_reciclagem.change_points)} · Circularidade: ${formatarNumero(snapshot.circularidade.percent, 2)}${snapshot.circularidade.percent === null ? "" : "%"}`} />
      <KpiDashboard demo={demo} titulo="Aguardando aprovação" valor={formatarNumero(snapshot.kpis.aguardando_aprovacao.value)} nota={`Prioritários: ${formatarNumero(snapshot.kpis.aguardando_aprovacao.prioritarios)}`} />
      <KpiDashboard demo={demo} titulo="Impacto recuperado (t)" valor={formatarNumero(snapshot.kpis.impacto_recuperado.tonnes, 3)} nota={`${formatarNumero(snapshot.kpis.impacto_recuperado.kg, 2)} kg`} />
      <KpiDashboard demo={demo} titulo="Circularidade (%)" valor={formatarNumero(snapshot.circularidade.percent, 2)} />
    </section>
    <section className={estilos.gradeGraficos} aria-label="Gráficos de visão geral">
      <GraficoDados demo={demo} titulo="Itens por situação" eixo="Situação" unidade="itens" vazio="Nenhum item contabilizado por situação neste período." pontos={snapshot.por_status.map(p => ({ rotulo: rotuloDashboard(p.nome), valor: p.quantidade }))} />
      <GraficoDados demo={demo} titulo="Itens por categoria" eixo="Categoria" unidade="itens" vazio="Nenhum item contabilizado por categoria neste período." pontos={snapshot.por_categoria.map(p => ({ rotulo: p.nome, valor: p.quantidade }))} />
      <GraficoDados demo={demo} titulo="Itens cadastrados e encaminhados por mês" eixo="Mês e movimento" unidade="itens" vazio="Nenhum cadastro ou encaminhamento contabilizado neste período." pontos={snapshot.itens_por_mes.flatMap(p => [{ rotulo: `${p.mes} · cadastro`, valor: p.cadastrados }, { rotulo: `${p.mes} · encaminhado`, valor: p.encaminhados }])} />
      <GraficoDados demo={demo} titulo="Alertas por gravidade" eixo="Gravidade" unidade="alertas" vazio="Nenhum alerta aberto neste período." pontos={snapshot.alertas.por_gravidade.map(p => ({ rotulo: rotuloDashboard(p.gravidade), valor: p.quantidade }))} />
      <section aria-label="Taxa de reciclagem"><h2>Taxa de reciclagem</h2>{demo && <SeloDemonstracao />}{snapshot.kpis.taxa_reciclagem.percent === null ? <p>A taxa de reciclagem ainda não foi calculada para este período.</p> : <DonutChart percentual={snapshot.kpis.taxa_reciclagem.percent} />}</section>
    </section>
  </div>
}
