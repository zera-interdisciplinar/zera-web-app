import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartCard } from './ChartCard'
import type { DashboardSnapshot } from '../../types/dashboardAnalytics'
import { formatarNumero, formatarPontosPercentuais, formatarVariacao } from '../../utils/formatarDashboard'
import estilos from '../../../styles/components/DashboardTabs/VisaoGeralTab.module.css'

const cores = ['#0b7f9f', '#ffa500', '#0caf79', '#ff402e', '#8fcbe5', '#af3e5b']

interface Props {
  snapshot: DashboardSnapshot | null
}

function rotuloStatus(valor: string): string {
  const rotulos: Record<string, string> = {
    PENDING_APPROVAL: 'Aguardando aprovação',
    DISCARDED: 'Descartado',
    ACTIVE: 'Em estoque',
    IN_MAINTENANCE: 'Em manutenção',
    REUSED: 'Reuso',
    REMOVED: 'Removido',
  }
  return rotulos[valor] ?? valor
}

function Kpi({ titulo, valor, nota }: { titulo: string; valor: string; nota?: string }) {
  return (
    <article className={estilos.kpi}>
      <h2>{titulo}</h2>
      <p className={estilos.valor}>{valor}</p>
      {nota && <p className={estilos.nota}>{nota}</p>}
    </article>
  )
}

function Barras({
  data,
  labelKey = 'nome',
  valueKey = 'quantidade',
  horizontal = false,
}: {
  data: Array<Record<string, string | number | null>>
  labelKey?: string
  valueKey?: string
  horizontal?: boolean
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, bottom: 12, left: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={horizontal} />
        <XAxis
          type={horizontal ? 'number' : 'category'}
          dataKey={horizontal ? undefined : labelKey}
          tickFormatter={horizontal ? undefined : (valor: string) => rotuloStatus(valor)}
          interval={0}
          angle={horizontal ? 0 : -12}
          textAnchor={horizontal ? 'middle' : 'end'}
          height={horizontal ? 32 : 48}
        />
        <YAxis type={horizontal ? 'category' : 'number'} dataKey={horizontal ? labelKey : undefined} width={horizontal ? 112 : 44} />
        <Tooltip labelFormatter={(valor) => rotuloStatus(String(valor))} />
        <Bar dataKey={valueKey} name="Quantidade" fill={cores[0]} radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {data.map((item, index) => <Cell key={String(item[labelKey])} fill={cores[index % cores.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function VisaoGeralTab({ snapshot }: Props) {
  const status = snapshot?.por_status.map((ponto) => ({ nome: ponto.nome, quantidade: ponto.quantidade })) ?? []
  const categorias = snapshot?.por_categoria.map((ponto) => ({ nome: ponto.nome, quantidade: ponto.quantidade })) ?? []
  const percentTaxa = snapshot?.kpis.taxa_reciclagem.percent
  const percentCircularidade = snapshot?.circularidade.percent

  return (
    <div className={estilos.conteudo}>
      {!snapshot && <p className={estilos.aviso} role="status">Aguardando dados do dashboard vindos da API.</p>}
      {snapshot && (
        <section className={estilos.gradeKpis} aria-label="Indicadores gerais">
          <Kpi titulo="Itens cadastrados" valor={formatarNumero(snapshot.kpis.itens_cadastrados.value)} nota={formatarVariacao(snapshot.kpis.itens_cadastrados.change_percent)} />
          <Kpi titulo="Alertas registrados" valor={formatarNumero(snapshot.alertas.abertos)} />
          <Kpi
            titulo="Taxa de reciclagem (%)"
            valor={formatarNumero(percentTaxa, 2)}
            nota={`Variação: ${formatarPontosPercentuais(snapshot.kpis.taxa_reciclagem.change_points)} · Circularidade: ${percentCircularidade === null ? '—' : `${formatarNumero(percentCircularidade, 2)}%`}`}
          />
          <Kpi titulo="Aguardando aprovação" valor={formatarNumero(snapshot.kpis.aguardando_aprovacao.value)} nota={`Prioritários: ${formatarNumero(snapshot.kpis.aguardando_aprovacao.prioritarios)}`} />
          <Kpi titulo="Impacto recuperado (t)" valor={formatarNumero(snapshot.kpis.impacto_recuperado.tonnes, 3)} nota={`${formatarNumero(snapshot.kpis.impacto_recuperado.kg, 2)} kg`} />
          <Kpi titulo="Circularidade (%)" valor={formatarNumero(percentCircularidade, 2)} />
        </section>
      )}

      {snapshot && (
        <section className={estilos.gradeGraficos} aria-label="Gráficos de visão geral">
          <ChartCard titulo="Itens por situação">
            <Barras data={status} />
          </ChartCard>
          <ChartCard titulo="Itens por categoria">
            <Barras data={categorias} />
          </ChartCard>
          <ChartCard titulo="Itens cadastrados e encaminhados por mês">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={snapshot.itens_por_mes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="cadastrados" name="Cadastrados" fill={cores[0]} isAnimationActive={false} />
                <Bar dataKey="encaminhados" name="Encaminhados" fill={cores[1]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard titulo="Alertas por gravidade">
            <Barras data={snapshot.alertas.por_gravidade.map(({ gravidade, quantidade }) => ({ nome: gravidade, quantidade }))} />
          </ChartCard>
        </section>
      )}
    </div>
  )
}
