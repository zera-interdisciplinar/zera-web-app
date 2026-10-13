import { useMemo, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  ErrorBar,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { itensVidaUtilFixture, type ItemVidaUtilDemo } from '../../mocks/dashboardTabs/itensVidaUtil'
import { SeloDemonstracao } from './SeloDemonstracao'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from './ItensVidaUtilTab.module.css'

type Faixa = { inicio: number; fim: number; rotulo: string }
type PontoFaixa = { faixa: string; quantidade: number }
type EstatisticaCaixa = {
  condicao: string
  minimo: number
  q1: number
  mediana: number
  q3: number
  maximo: number
  amplitude: number
  margens: [number, number]
}

const COR = '#087f9f'
const GRADE = '#e5e7eb'
const SITUACAO_POR_STATUS: Record<string, string> = {
  PENDING_APPROVAL: 'Aguardando aprovação',
  DISCARDED: 'Descartado',
  ACTIVE: 'Em estoque',
  IN_MAINTENANCE: 'Em manutenção',
  REUSED: 'Reuso',
  REMOVED: 'Removido',
}

function statusDoItemCorresponde(situacao: string, status: string): boolean {
  return SITUACAO_POR_STATUS[status] === situacao
}

function CartaoGrafico({ titulo, children }: { titulo: string; children: ReactNode }) {
  const id = `grafico-${titulo.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section className={estilos.chartCard} aria-labelledby={id}>
      <h2 id={id}>{titulo}<SeloDemonstracao /></h2>
      <div className={estilos.chart} role="group" aria-label={`Gráfico: ${titulo}`}>
        {children}
      </div>
    </section>
  )
}

function criarFaixas(valores: number[], tamanho: number, rotuloUnidade: string): Faixa[] {
  const maximo = Math.max(1, ...valores)
  const quantidade = Math.max(1, Math.ceil((maximo + 1) / tamanho))

  return Array.from({ length: quantidade }, (_, indice) => {
    const inicio = indice * tamanho
    const fim = inicio + tamanho
    return {
      inicio,
      fim,
      rotulo: `${inicio}–${fim - 1} ${rotuloUnidade}`,
    }
  })
}

function criarHistograma(valores: number[], tamanho: number, unidade: string): PontoFaixa[] {
  const faixas = criarFaixas(valores, tamanho, unidade)
  return faixas.map((faixa) => ({
    faixa: faixa.rotulo,
    quantidade: valores.filter((valor) => valor >= faixa.inicio && valor < faixa.fim).length,
  }))
}

function Histograma({
  dados,
  tamanhoFaixa,
  unidade,
}: {
  dados: number[]
  tamanhoFaixa: number
  unidade: string
}) {
  const pontos = criarHistograma(dados, tamanhoFaixa, unidade)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={pontos} margin={{ top: 8, right: 10, bottom: 20, left: 0 }}>
        <CartesianGrid stroke={GRADE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="faixa" angle={-12} textAnchor="end" interval={0} height={48} tick={{ fontSize: 10 }} />
        <YAxis allowDecimals={false} width={34} tick={{ fontSize: 10 }} />
        <Tooltip formatter={(valor) => [valor, 'Itens']} />
        <Bar dataKey="quantidade" name="Itens" fill={COR} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function quantil(ordenados: number[], fracao: number): number {
  if (ordenados.length === 0) return 0
  const posicao = (ordenados.length - 1) * fracao
  const inferior = Math.floor(posicao)
  const superior = Math.ceil(posicao)
  const parcela = posicao - inferior
  return ordenados[inferior] + (ordenados[superior] - ordenados[inferior]) * parcela
}

function resumirPorCondicao(
  itens: ItemVidaUtilDemo[],
  obterValor: (item: ItemVidaUtilDemo) => number,
): EstatisticaCaixa[] {
  return itensVidaUtilFixture.condicoes
    .map((condicao) => {
      const valores = itens
        .filter((item) => item.condicao === condicao)
        .map(obterValor)
        .sort((a, b) => a - b)
      if (valores.length === 0) return null

      const q1 = quantil(valores, 0.25)
      const mediana = quantil(valores, 0.5)
      const q3 = quantil(valores, 0.75)
      return {
        condicao,
        minimo: valores[0],
        q1,
        mediana,
        q3,
        maximo: valores[valores.length - 1],
        amplitude: q3 - q1,
        margens: [q3 - valores[0], valores[valores.length - 1] - q3] as [number, number],
      }
    })
    .filter((valor): valor is EstatisticaCaixa => valor !== null)
}

function Boxplot({ dados, unidade }: { dados: EstatisticaCaixa[]; unidade: string }) {
  const maximo = Math.max(1, ...dados.map((item) => item.maximo))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={dados} margin={{ top: 8, right: 18, bottom: 12, left: 0 }}>
        <CartesianGrid stroke={GRADE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="condicao" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, Math.ceil(maximo * 1.1)]} width={42} tick={{ fontSize: 10 }} />
        <Tooltip
          formatter={(valor, nome) => [Number(valor).toLocaleString('pt-BR', { maximumFractionDigits: 1 }), nome]}
          labelFormatter={(rotulo) => `Condição: ${rotulo}`}
        />
        <Bar dataKey="q1" stackId="caixa" fill="transparent" stroke="transparent" isAnimationActive={false} />
        <Bar
          dataKey="amplitude"
          name={`Intervalo interquartil (${unidade})`}
          stackId="caixa"
          fill={COR}
          fillOpacity={0.82}
          isAnimationActive={false}
          shape={(props) => {
            const item = props.payload as EstatisticaCaixa
            const x = Number(props.x ?? 0)
            const y = Number(props.y ?? 0)
            const largura = Number(props.width ?? 0)
            const altura = Number(props.height ?? 0)
            const razaoMediana = item.amplitude === 0 ? 0.5 : (item.q3 - item.mediana) / item.amplitude
            const xCaixa = x + largura * 0.24
            const larguraCaixa = largura * 0.52
            const yMediana = y + altura * razaoMediana

            return (
              <g>
                <rect x={xCaixa} y={y} width={larguraCaixa} height={altura} fill={COR} fillOpacity={0.82} />
                <line x1={xCaixa} x2={xCaixa + larguraCaixa} y1={yMediana} y2={yMediana} stroke="#083344" strokeWidth={2} />
              </g>
            )
          }}
        >
          <ErrorBar dataKey="margens" direction="y" width={8} stroke="#075985" strokeWidth={1.5} />
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  )
}

function Dispersao({
  dados,
  xKey,
  xNome,
  xUnidade,
  yKey,
  yNome,
  yUnidade,
}: {
  dados: ItemVidaUtilDemo[]
  xKey: 'idadeMeses' | 'pesoKg'
  xNome: string
  xUnidade: string
  yKey: 'vidaUtilConsumidaPercentual' | 'vidaUtilMeses'
  yNome: string
  yUnidade: string
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 16, bottom: 16, left: 8 }}>
        <CartesianGrid stroke={GRADE} strokeDasharray="3 3" />
        <XAxis type="number" dataKey={xKey} name={xNome} unit={xUnidade} tick={{ fontSize: 10 }} />
        <YAxis type="number" dataKey={yKey} name={yNome} unit={yUnidade} width={46} tick={{ fontSize: 10 }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="Itens" data={dados} fill={COR} fillOpacity={0.78} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export function ItensVidaUtilTab({ demo, filtros }: { demo: boolean; filtros: FiltrosDashboard }) {
  const itens = useMemo(
    () =>
      demo
        ? itensVidaUtilFixture.itens.filter((item) => {
            if (filtros.category && item.categoria !== filtros.category) return false
            if (filtros.status && !statusDoItemCorresponde(item.situacao, filtros.status)) return false
            if (filtros.condition && item.condicao !== filtros.condition) return false
            if (filtros.registrationMonth && item.mesCadastro !== filtros.registrationMonth) return false
            return true
          })
        : [],
    [demo, filtros],
  )

  if (!demo) {
    return (
      <section className={estilos.sourceState} aria-labelledby="fonte-vida-util">
        <h2 id="fonte-vida-util">Dados analíticos sem fonte confirmada</h2>
        <p>
          O contrato disponível de <code>/api/v1/dashboard/overview</code> não fornece idade, peso estimado,
          vida útil, garantia, condição ou data individual de cadastro. Os gráficos desta aba serão exibidos
          quando o Swagger confirmar uma fonte para esses campos.
        </p>
      </section>
    )
  }

  const idade = itens.map((item) => item.idadeMeses)
  const peso = itens.map((item) => item.pesoKg)
  const vidaUtil = itens.map((item) => item.vidaUtilMeses)
  const garantia = itens.map((item) => item.garantiaMeses)
  const vidaConsumida = itens.map((item) => item.vidaUtilConsumidaPercentual)
  const mesesRestantes = itens.map((item) => item.mesesRestantes)
  const boxIdade = resumirPorCondicao(itens, (item) => item.idadeMeses)
  const boxPeso = resumirPorCondicao(itens, (item) => item.pesoKg)
  return (
    <div className={estilos.tab}>
      <p className={estilos.summary} aria-live="polite">
        {itens.length} {itens.length === 1 ? 'item' : 'itens'} na seleção de demonstração.
      </p>

      <div className={estilos.chartGrid}>
        <CartaoGrafico titulo="Distribuição da idade dos itens (meses)">
          <Histograma dados={idade} tamanhoFaixa={12} unidade="meses" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Distribuição do peso estimado (kg)">
          <Histograma dados={peso} tamanhoFaixa={10} unidade="kg" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Distribuição da vida útil estimada (meses)">
          <Histograma dados={vidaUtil} tamanhoFaixa={12} unidade="meses" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Distribuição da garantia (meses)">
          <Histograma dados={garantia} tamanhoFaixa={12} unidade="meses" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Distribuição da vida útil consumida (%)">
          <Histograma dados={vidaConsumida} tamanhoFaixa={20} unidade="%" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Distribuição dos meses restantes">
          <Histograma dados={mesesRestantes} tamanhoFaixa={12} unidade="meses" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Idade por condição — boxplot">
          <Boxplot dados={boxIdade} unidade="meses" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Peso por condição — boxplot">
          <Boxplot dados={boxPeso} unidade="kg" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Vida útil consumida por situação">
          <Boxplot
            dados={itensVidaUtilFixture.situacoes
              .map((situacao) => {
                const valores = itens
                  .filter((item) => item.situacao === situacao)
                  .map((item) => item.vidaUtilConsumidaPercentual)
                  .sort((a, b) => a - b)
                if (valores.length === 0) return null
                const q1 = quantil(valores, 0.25)
                const mediana = quantil(valores, 0.5)
                const q3 = quantil(valores, 0.75)
                return {
                  condicao: situacao,
                  minimo: valores[0],
                  q1,
                  mediana,
                  q3,
                  maximo: valores[valores.length - 1],
                  amplitude: q3 - q1,
                  margens: [q3 - valores[0], valores[valores.length - 1] - q3] as [number, number],
                }
              })
              .filter((valor): valor is EstatisticaCaixa => valor !== null)}
            unidade="%"
          />
        </CartaoGrafico>
        <CartaoGrafico titulo="Idade × vida útil consumida">
          <Dispersao
            dados={itens}
            xKey="idadeMeses"
            xNome="Idade"
            xUnidade=" meses"
            yKey="vidaUtilConsumidaPercentual"
            yNome="Vida útil consumida"
            yUnidade="%"
          />
        </CartaoGrafico>
        <CartaoGrafico titulo="Peso × vida útil estimada">
          <Dispersao
            dados={itens}
            xKey="pesoKg"
            xNome="Peso"
            xUnidade=" kg"
            yKey="vidaUtilMeses"
            yNome="Vida útil estimada"
            yUnidade=" meses"
          />
        </CartaoGrafico>
      </div>
    </div>
  )
}
