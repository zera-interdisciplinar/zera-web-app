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
import type { DashboardMockVisaoGeral, DashboardSnapshot } from '../../types/dashboardAnalytics'
import { dashboardOverviewMock } from '../../mocks/dashboardSseFixture'
import { formatarNumero, formatarPontosPercentuais, formatarVariacao } from '../../utils/formatarDashboard'
import { SeloDemonstracao } from './SeloDemonstracao'
import estilos from './VisaoGeralTab.module.css'

const cores = ['#0b7f9f', '#ffa500', '#0caf79', '#ff402e', '#8fcbe5', '#af3e5b']

interface Props {
  snapshot: DashboardSnapshot | null
  demo: boolean
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

function Kpi({ titulo, valor, nota, demo }: { titulo: string; valor: string; nota?: string; demo: boolean }) {
  return (
    <article className={estilos.kpi}>
      <h2>{titulo}{demo && <SeloDemonstracao />}</h2>
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
        <Bar dataKey={valueKey} name="Quantidade" fill={cores[0]} radius={[3, 3, 0, 0]}>
          {data.map((item, index) => <Cell key={String(item[labelKey])} fill={cores[index % cores.length]} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function VisaoGeralTab({ snapshot, demo }: Props) {
  // Os dados que não estão no snapshot permanecem explícitos como fixture local.
  const suplemento: DashboardMockVisaoGeral | null = demo ? dashboardOverviewMock : null
  const status = snapshot?.por_status.map((ponto) => ({ nome: ponto.nome, quantidade: ponto.quantidade })) ?? []
  const categorias = snapshot?.por_categoria.map((ponto) => ({ nome: ponto.nome, quantidade: ponto.quantidade })) ?? []
  const semFonte = 'Sem fonte confirmada nos endpoints documentados.'
  const percentTaxa = snapshot?.kpis.taxa_reciclagem.percent
  const percentCircularidade = snapshot?.circularidade.percent

  return (
    <div className={estilos.conteudo}>
      {!snapshot && <p className={estilos.aviso} role="status">Aguardando o snapshot do dashboard.</p>}
      {snapshot && (
        <section className={estilos.gradeKpis} aria-label="Indicadores gerais">
          <Kpi demo={demo} titulo="Itens cadastrados" valor={formatarNumero(snapshot.kpis.itens_cadastrados.value)} nota={formatarVariacao(snapshot.kpis.itens_cadastrados.change_percent)} />
          <Kpi demo={demo} titulo="Eventos registrados" valor={formatarNumero(demo ? suplemento?.eventosRegistrados : null)} nota={demo ? 'Fixture MSW' : semFonte} />
          <Kpi demo={demo} titulo="Modelos cadastrados" valor={formatarNumero(demo ? suplemento?.modelosCadastrados : null)} nota={demo ? 'Fixture MSW' : semFonte} />
          <Kpi demo={demo} titulo="Alertas registrados" valor={formatarNumero(snapshot.alertas.abertos)} />
          <Kpi demo={demo} titulo="Cadastros (variação %)" valor={formatarVariacao(snapshot.kpis.itens_cadastrados.change_percent).replace(' em relação à janela anterior', '')} />
          {/* TODO(contrato): confirmar se taxa_reciclagem mede exatamente itens com potencial reciclável. */}
          <Kpi
            demo={demo}
            titulo="Itens com potencial reciclável (%)"
            valor={formatarNumero(percentTaxa, 2)}
            nota={`Variação: ${formatarPontosPercentuais(snapshot.kpis.taxa_reciclagem.change_points)} · Circularidade: ${percentCircularidade === null ? '—' : `${formatarNumero(percentCircularidade, 2)}%`}`}
          />
          <Kpi demo={demo} titulo="Danos informados" valor={formatarNumero(demo ? suplemento?.danosInformados : null)} nota={demo ? 'Fixture MSW' : semFonte} />
          <Kpi demo={demo} titulo="Eventos por item" valor={formatarNumero(demo ? suplemento?.eventosPorItem : null, 2)} nota={demo ? 'Fixture MSW' : semFonte} />
          <Kpi demo={demo} titulo="Materiais com classificação de reciclabilidade" valor={formatarNumero(demo ? suplemento?.materiaisClassificados : null)} nota={demo ? 'Fixture MSW' : semFonte} />
        </section>
      )}

      {snapshot && (
        <section className={estilos.gradeGraficos} aria-label="Gráficos de visão geral">
          <ChartCard demo={demo} titulo="Itens por situação">
            <Barras data={status} />
          </ChartCard>
          <ChartCard demo={demo} titulo="Itens por categoria">
            <Barras data={categorias} />
          </ChartCard>
          <ChartCard demo={demo} titulo="Itens por condição" nota={demo ? 'Fixture MSW' : semFonte}>
            {demo && suplemento ? <Barras data={suplemento.itensPorCondicao.map(({ name, value }) => ({ name, value }))} labelKey="name" valueKey="value" /> : <p className={estilos.semDado}>{semFonte}</p>}
          </ChartCard>
          <ChartCard demo={demo} titulo="Itens por fabricante" nota={demo ? 'Fixture MSW' : semFonte}>
            {demo && suplemento ? <Barras data={suplemento.itensPorFabricante.map(({ name, value }) => ({ name, value }))} labelKey="name" valueKey="value" horizontal /> : <p className={estilos.semDado}>{semFonte}</p>}
          </ChartCard>
          <ChartCard demo={demo} titulo="Itens por modelo" nota={demo ? 'Fixture MSW' : semFonte}>
            {demo && suplemento ? <Barras data={suplemento.itensPorModelo.map(({ name, value }) => ({ name, value }))} labelKey="name" valueKey="value" horizontal /> : <p className={estilos.semDado}>{semFonte}</p>}
          </ChartCard>
        </section>
      )}
    </div>
  )
}
