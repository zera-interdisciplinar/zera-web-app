import { SeloDemonstracao } from './SeloDemonstracao'
import { GraficoDados } from '../GraficoDados'
import { DonutChart } from '../DonutChart'
import { Skeleton } from '../Skeleton'
import type { DashboardSnapshot } from '../../types/dashboardAnalytics'
import { formatarNumero, formatarPontosPercentuais, formatarVariacao } from '../../utils/formatarDashboard'
import { rotuloDashboard } from '../../utils/rotulosDashboard'
import estilos from '../../../styles/components/DashboardTabs/VisaoGeralTab.module.css'

interface Props { snapshot: DashboardSnapshot | null; demo?: boolean; aguardando?: boolean }
interface KpiProps { titulo: string; valor: string; nota?: string; demo?: boolean }
function Kpi({ titulo, valor, nota, demo }: KpiProps) {
  return <article className={estilos.kpi}><h2>{titulo}</h2>{demo && <SeloDemonstracao />}<p className={estilos.valor}>{valor}</p>{nota && <p className={estilos.nota}>{nota}</p>}</article>
}
export function VisaoGeralTab({ snapshot, demo = false, aguardando = true }: Props) {
  if (!snapshot) return aguardando ? <Skeleton descricao="Preparando os dados…" linhas={4} /> : null
  return <div className={estilos.conteudo}>
    <section className={estilos.gradeKpis} aria-label="Indicadores gerais">
      <Kpi demo={demo} titulo="Itens cadastrados" valor={formatarNumero(snapshot.kpis.itens_cadastrados.value)} nota={formatarVariacao(snapshot.kpis.itens_cadastrados.change_percent)} />
      <Kpi demo={demo} titulo="Alertas registrados" valor={formatarNumero(snapshot.alertas.abertos)} />
      <Kpi demo={demo} titulo="Taxa de reciclagem (%)" valor={formatarNumero(snapshot.kpis.taxa_reciclagem.percent, 2)} nota={`Variação: ${formatarPontosPercentuais(snapshot.kpis.taxa_reciclagem.change_points)} · Circularidade: ${formatarNumero(snapshot.circularidade.percent, 2)}${snapshot.circularidade.percent === null ? "" : "%"}`} />
      <Kpi demo={demo} titulo="Aguardando aprovação" valor={formatarNumero(snapshot.kpis.aguardando_aprovacao.value)} nota={`Prioritários: ${formatarNumero(snapshot.kpis.aguardando_aprovacao.prioritarios)}`} />
      <Kpi demo={demo} titulo="Impacto recuperado (t)" valor={formatarNumero(snapshot.kpis.impacto_recuperado.tonnes, 3)} nota={`${formatarNumero(snapshot.kpis.impacto_recuperado.kg, 2)} kg`} />
      <Kpi demo={demo} titulo="Circularidade (%)" valor={formatarNumero(snapshot.circularidade.percent, 2)} />
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
