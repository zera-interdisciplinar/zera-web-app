import { useMemo, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { evolucaoMovimentacoesFixture } from '../../mocks/dashboardTabs/evolucaoMovimentacoes'
import { SeloDemonstracao } from './SeloDemonstracao'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from './EvolucaoMovimentacoesTab.module.css'

type Ponto = { rotulo: string; quantidade: number }
type PontoMensal = Record<string, string | number> & { mes: string; rotulo: string }

const CORES = ['#087f9f', '#ffa600', '#00a878', '#f44336', '#7abfe0', '#aa4058', '#7c3aed', '#14b8a6', '#e87932']
const GRADE = '#e5e7eb'

function CartaoGrafico({ titulo, children, largo = false }: { titulo: string; children: ReactNode; largo?: boolean }) {
  const id = `evolucao-${titulo.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-')}`
  return (
    <section className={`${estilos.chartCard} ${largo ? estilos.wide : ''}`} aria-labelledby={id}>
      <h2 id={id}>{titulo}<SeloDemonstracao /></h2>
      <div className={estilos.chart} role="group" aria-label={`Gráfico: ${titulo}`}>
        {children}
      </div>
    </section>
  )
}

function formatarMes(mes: string): string {
  const [ano, numeroMes] = mes.split('-').map(Number)
  const nome = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(new Date(Date.UTC(ano, numeroMes - 1, 1)))
    .replace('.', '')
  return `${nome[0].toLocaleUpperCase('pt-BR')}${nome.slice(1)}/${String(ano).slice(-2)}`
}

function contarPor<T>(registros: T[], chave: (registro: T) => string): Ponto[] {
  const totais = new Map<string, number>()
  registros.forEach((registro) => {
    const rotulo = chave(registro)
    totais.set(rotulo, (totais.get(rotulo) ?? 0) + 1)
  })

  return [...totais.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([rotulo, quantidade]) => ({ rotulo, quantidade }))
}

function TooltipDate({ valor }: { valor: string }) {
  return <>{valor}</>
}

function GraficoSerieDiaria({ dados, nome }: { dados: Ponto[]; nome: string }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={dados} margin={{ top: 10, right: 14, bottom: 26, left: 2 }}>
        <CartesianGrid stroke={GRADE} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="rotulo" interval="preserveStartEnd" angle={-20} textAnchor="end" height={46} tick={{ fontSize: 9 }} />
        <YAxis allowDecimals={false} width={34} tick={{ fontSize: 10 }} />
        <Tooltip labelFormatter={(rotulo) => <TooltipDate valor={String(rotulo)} />} />
        <Line type="monotone" dataKey="quantidade" name={nome} stroke={CORES[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function GraficoPorMes({ dados, nome, tipo = 'bar' }: { dados: Ponto[]; nome: string; tipo?: 'bar' | 'line' }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {tipo === 'line' ? (
        <LineChart data={dados} margin={{ top: 10, right: 14, bottom: 12, left: 2 }}>
          <CartesianGrid stroke={GRADE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="rotulo" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} width={34} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="quantidade" name={nome} stroke={CORES[0]} strokeWidth={2} activeDot={{ r: 4 }} />
        </LineChart>
      ) : (
        <BarChart data={dados} margin={{ top: 10, right: 14, bottom: 12, left: 2 }}>
          <CartesianGrid stroke={GRADE} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="rotulo" tick={{ fontSize: 10 }} />
          <YAxis allowDecimals={false} width={34} tick={{ fontSize: 10 }} />
          <Tooltip />
          <Bar dataKey="quantidade" name={nome} fill={CORES[0]} isAnimationActive={false} />
        </BarChart>
      )}
    </ResponsiveContainer>
  )
}

export function EvolucaoMovimentacoesTab({ demo, filtros }: { demo: boolean; filtros: FiltrosDashboard }) {
  const itens = useMemo(() => {
    if (!demo) return []
    const mesesDisponiveis = [...new Set(evolucaoMovimentacoesFixture.itens.map((item) => item.dataCadastro.slice(0, 7)))].sort()
    const mesesSelecionados = filtros.period === '30d'
      ? mesesDisponiveis.slice(-1)
      : filtros.period === '12m' ? mesesDisponiveis.slice(-12) : mesesDisponiveis.slice(-6)
    return evolucaoMovimentacoesFixture.itens.filter((item) => {
      if (filtros.unitId && item.unidadeId !== filtros.unitId) return false
      return mesesSelecionados.includes(item.dataCadastro.slice(0, 7))
    })
  }, [demo, filtros.period, filtros.unitId])

  const eventos = useMemo(() => {
    if (!demo) return []
    const mesesDisponiveis = [...new Set(evolucaoMovimentacoesFixture.eventos.map((evento) => evento.dataEvento.slice(0, 7)))].sort()
    const mesesSelecionados = filtros.period === '30d'
      ? mesesDisponiveis.slice(-1)
      : filtros.period === '12m' ? mesesDisponiveis.slice(-12) : mesesDisponiveis.slice(-6)
    return evolucaoMovimentacoesFixture.eventos.filter((evento) => {
      if (filtros.unitId && evento.unidadeId !== filtros.unitId) return false
      return mesesSelecionados.includes(evento.dataEvento.slice(0, 7))
    })
  }, [demo, filtros.period, filtros.unitId])

  if (!demo) {
    return (
      <section className={estilos.sourceState} aria-labelledby="fonte-evolucao">
        <h2 id="fonte-evolucao">Séries de evolução sem fonte confirmada</h2>
        <p>
          O contrato SSE fornece apenas agregados mensais de itens cadastrados e encaminhados. Ele não define séries
          diárias, situação por mês, idade individual, eventos por data ou tipo, movimentações nem os vínculos por
          unidade necessários para estes gráficos.
        </p>
      </section>
    )
  }

  const meses = [...new Set(itens.map((item) => item.dataCadastro.slice(0, 7)))].sort()
  const eventosPorMes = [...new Set(eventos.map((evento) => evento.dataEvento.slice(0, 7)))].sort()
  const registrosPorMes: PontoMensal[] = meses.map((mes) => {
    const registrosDoMes = itens.filter((item) => item.dataCadastro.startsWith(mes))
    const idades = registrosDoMes.map((item) => item.idadeMeses)
    const ponto: PontoMensal = {
      mes,
      rotulo: formatarMes(mes),
      cadastrados: registrosDoMes.length,
      idadeMedia: idades.length > 0 ? idades.reduce((total, idade) => total + idade, 0) / idades.length : 0,
    }
    const situacoes = [...new Set(itens.map((item) => item.situacao))]
    situacoes.forEach((situacao) => {
      ponto[situacao] = registrosDoMes.filter((item) => item.situacao === situacao).length
    })
    return ponto
  })
  const novosItensEMovimentacoes = meses.map((mes) => ({
    rotulo: formatarMes(mes),
    novosItens: itens.filter((item) => item.dataCadastro.startsWith(mes)).length,
    movimentacoes: eventos.filter(
      (evento) => evento.dataEvento.startsWith(mes) && evolucaoMovimentacoesFixture.tiposMovimentacao.includes(evento.tipo),
    ).length,
  }))
  const tiposEvento = [...new Set(eventos.map((evento) => evento.tipo))].sort()
  const eventosMensais = eventosPorMes.map((mes) => {
    const ponto: PontoMensal = { mes, rotulo: formatarMes(mes) }
    tiposEvento.forEach((tipo) => {
      ponto[tipo] = eventos.filter((evento) => evento.dataEvento.startsWith(mes) && evento.tipo === tipo).length
    })
    return ponto
  })
  const eventosTipo = contarPor(eventos, (evento) => evento.tipo)
  const movimentacoesPorTipo = contarPor(
    eventos.filter((evento) => evolucaoMovimentacoesFixture.tiposMovimentacao.includes(evento.tipo)),
    (evento) => evento.tipo,
  )
  const cadastrosPorDia = contarPor(itens, (item) => item.dataCadastro)
  const eventosPorDia = contarPor(eventos, (evento) => evento.dataEvento)
  const situacoes = [...new Set(itens.map((item) => item.situacao))]

  return (
    <div className={estilos.tab}>
      <p className={estilos.summary} aria-live="polite">
        {itens.length} cadastros e {eventos.length} eventos na seleção de demonstração.
      </p>

      <div className={estilos.chartGrid}>
        <CartaoGrafico titulo="Cadastros por dia">
          <GraficoSerieDiaria dados={cadastrosPorDia} nome="Cadastros" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Cadastros por mês">
          <GraficoPorMes
            dados={registrosPorMes.map((ponto) => ({ rotulo: ponto.rotulo, quantidade: Number(ponto.cadastrados) }))}
            nome="Cadastros"
          />
        </CartaoGrafico>
        <CartaoGrafico titulo="Cadastros por situação e mês" largo>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={registrosPorMes} margin={{ top: 10, right: 18, bottom: 12, left: 2 }}>
              <CartesianGrid stroke={GRADE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="rotulo" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} width={34} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              {situacoes.map((situacao, index) => (
                <Bar key={situacao} dataKey={situacao} stackId="situacao" fill={CORES[index % CORES.length]} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>
        <CartaoGrafico titulo="Idade média dos itens por mês">
          <GraficoPorMes
            dados={registrosPorMes.map((ponto) => ({ rotulo: ponto.rotulo, quantidade: Number(ponto.idadeMedia) }))}
            nome="Idade média (meses)"
            tipo="line"
          />
        </CartaoGrafico>
        <CartaoGrafico titulo="Eventos por dia">
          <GraficoSerieDiaria dados={eventosPorDia} nome="Eventos" />
        </CartaoGrafico>
        <CartaoGrafico titulo="Eventos por tipo">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventosTipo} layout="vertical" margin={{ top: 8, right: 14, bottom: 8, left: 12 }}>
              <CartesianGrid stroke={GRADE} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="rotulo" width={112} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="quantidade" name="Eventos" fill={CORES[0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </CartaoGrafico>
        <CartaoGrafico titulo="Evolução mensal dos eventos por tipo" largo>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={eventosMensais} margin={{ top: 8, right: 18, bottom: 10, left: 2 }}>
              <CartesianGrid stroke={GRADE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="rotulo" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} width={34} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              {tiposEvento.map((tipo, index) => (
                <Line
                  key={tipo}
                  type="monotone"
                  dataKey={tipo}
                  name={tipo}
                  stroke={CORES[index % CORES.length]}
                  strokeWidth={1.7}
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CartaoGrafico>
        <CartaoGrafico titulo="Evolução mensal de novos itens e movimentações">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={novosItensEMovimentacoes} margin={{ top: 8, right: 12, bottom: 10, left: 2 }}>
              <CartesianGrid stroke={GRADE} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="rotulo" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} width={34} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="novosItens" name="Novos itens" stroke={CORES[0]} strokeWidth={2} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="movimentacoes" name="Movimentações" stroke={CORES[1]} strokeWidth={2} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CartaoGrafico>
        <CartaoGrafico titulo="Participação das movimentações por tipo">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={movimentacoesPorTipo}
                dataKey="quantidade"
                nameKey="rotulo"
                name="Movimentações"
                innerRadius="48%"
                outerRadius="76%"
                paddingAngle={2}
                isAnimationActive={false}
              >
                {movimentacoesPorTipo.map((ponto, index) => (
                  <Cell key={ponto.rotulo} fill={CORES[index % CORES.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CartaoGrafico>
      </div>
    </div>
  )
}
