import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { materiaisSustentabilidadeDemo } from '../../mocks/dashboardTabs/materiaisSustentabilidade'
import { SeloDemonstracao } from './SeloDemonstracao'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from './MateriaisSustentabilidadeTab.module.css'

interface MateriaisSustentabilidadeTabProps {
  demo: boolean
  filtros: FiltrosDashboard
}
const cores = { principal: '#087f9c', sim: '#ffa500' }
const coresDonut = [cores.principal, cores.sim]

function correspondeAoFiltroBooleano(valor: boolean, filtro: string | undefined): boolean {
  if (!filtro) return true
  return valor === (filtro === 'Sim')
}

function agruparPorMaterial(
  associacoes: typeof materiaisSustentabilidadeDemo.associacoes,
  chave: 'reciclavel' | 'perigoso',
) {
  const materiais = new Map<string, { material: string; sim: number; nao: number }>()
  associacoes.forEach((associacao) => {
    const atual = materiais.get(associacao.material) ?? { material: associacao.material, sim: 0, nao: 0 }
    atual[associacao[chave] ? 'sim' : 'nao'] += 1
    materiais.set(associacao.material, atual)
  })
  return [...materiais.values()]
}

function contarClassificacao(
  itens: { reciclavel: boolean; perigoso: boolean }[],
  chave: 'reciclavel' | 'perigoso',
) {
  const sim = itens.filter((item) => item[chave]).length
  return [
    { classificacao: 'Não', quantidade: itens.length - sim },
    { classificacao: 'Sim', quantidade: sim },
  ]
}

function agruparPorCondicao(
  itens: typeof materiaisSustentabilidadeDemo.itens,
  chave: 'reciclavel' | 'perigoso',
) {
  const condicoes = new Map<string, { condicao: string; sim: number; nao: number }>()
  itens.forEach((item) => {
    const atual = condicoes.get(item.condicao) ?? { condicao: item.condicao, sim: 0, nao: 0 }
    atual[item[chave] ? 'sim' : 'nao'] += 1
    condicoes.set(item.condicao, atual)
  })
  return [...condicoes.values()]
}

export function MateriaisSustentabilidadeTab({ demo, filtros }: MateriaisSustentabilidadeTabProps) {
  const itens = useMemo(() => {
    if (!demo) return []
    return materiaisSustentabilidadeDemo.itens.filter((item) =>
      correspondeAoFiltroBooleano(item.reciclavel, filtros.recyclable) &&
      correspondeAoFiltroBooleano(item.perigoso, filtros.hazardous) &&
      (!filtros.condition || item.condicao === filtros.condition),
    )
  }, [demo, filtros.condition, filtros.hazardous, filtros.recyclable])

  const associacoes = useMemo(() => {
    if (!demo) return []
    const idsDosItens = new Set(itens.map((item) => item.id))
    return materiaisSustentabilidadeDemo.associacoes.filter((associacao) =>
      idsDosItens.has(associacao.idItem) &&
      correspondeAoFiltroBooleano(associacao.reciclavel, filtros.recyclable) &&
      correspondeAoFiltroBooleano(associacao.perigoso, filtros.hazardous),
    )
  }, [demo, filtros.hazardous, filtros.recyclable, itens])

  const quantidadePorMaterial = useMemo(() => agruparPorMaterial(associacoes, 'perigoso'), [associacoes])
  const associacoesPerigosas = useMemo(
    () => associacoes.filter((associacao) => associacao.perigoso).map((associacao) => ({ ...associacao, quantidade: 1 })),
    [associacoes],
  )
  const associacoesReciclaveis = useMemo(
    () => associacoes.filter((associacao) => associacao.reciclavel).map((associacao) => ({ ...associacao, quantidade: 1 })),
    [associacoes],
  )
  const porClassificacaoReciclavel = useMemo(() => contarClassificacao(itens, 'reciclavel'), [itens])
  const porClassificacaoPerigosa = useMemo(() => contarClassificacao(itens, 'perigoso'), [itens])
  const condicaoReciclavel = useMemo(() => agruparPorCondicao(itens, 'reciclavel'), [itens])
  const condicaoPerigosa = useMemo(() => agruparPorCondicao(itens, 'perigoso'), [itens])
  const donutReciclavel = useMemo(() => {
    const reciclaveis = associacoes.filter((associacao) => associacao.reciclavel).length
    return [
      { nome: 'Sim', quantidade: reciclaveis },
      { nome: 'Não', quantidade: associacoes.length - reciclaveis },
    ]
  }, [associacoes])

  return (
    <section className={estilos.pagina} aria-label="Materiais e sustentabilidade">
      {demo ? (
        <div className={estilos.grade}>
          <article className={`${estilos.cartao} ${estilos.larguraTotal}`}>
            <h2>Quantidade de itens por material<SeloDemonstracao /></h2>
            <div className={estilos.graficoGrande} role="img" aria-label="Associações de itens por material e classificação de perigo">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quantidadePorMaterial} layout="vertical" margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                  <CartesianGrid stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} label={{ value: 'Associações de itens', position: 'insideBottom', offset: -4 }} />
                  <YAxis type="category" dataKey="material" width={150} />
                  <Tooltip />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="nao" name="Material perigoso: Não" stackId="perigo" fill={cores.principal} />
                  <Bar dataKey="sim" name="Material perigoso: Sim" stackId="perigo" fill={cores.sim} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className={estilos.cartao}>
            <h2>Itens por classificação de reciclabilidade<SeloDemonstracao /></h2>
            <GraficoClassificacao dados={porClassificacaoReciclavel} nome="Material reciclável" />
          </article>

          <article className={estilos.cartao}>
            <h2>Itens associados a material perigoso<SeloDemonstracao /></h2>
            <GraficoClassificacao dados={porClassificacaoPerigosa} nome="Material perigoso" />
          </article>

          <article className={estilos.cartao}>
            <h2>Associações de itens a materiais perigosos<SeloDemonstracao /></h2>
            <GraficoAssociacoes dados={associacoesPerigosas} />
          </article>

          <article className={estilos.cartao}>
            <h2>Associações de itens a materiais recicláveis<SeloDemonstracao /></h2>
            <GraficoAssociacoes dados={associacoesReciclaveis} />
          </article>

          <article className={estilos.cartao}>
            <h2>Itens por condição e potencial reciclável<SeloDemonstracao /></h2>
            <GraficoPorCondicao dados={condicaoReciclavel} legenda="Potencial reciclável" />
          </article>

          <article className={estilos.cartao}>
            <h2>Itens por condição e material perigoso<SeloDemonstracao /></h2>
            <GraficoPorCondicao dados={condicaoPerigosa} legenda="Material perigoso" />
          </article>

          <article className={estilos.cartao}>
            <h2>Associações por potencial de reciclagem<SeloDemonstracao /></h2>
            <div className={estilos.grafico} role="img" aria-label="Proporção das associações de materiais recicláveis">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutReciclavel} dataKey="quantidade" nameKey="nome" innerRadius="52%" outerRadius="78%" paddingAngle={1}>
                    {donutReciclavel.map((ponto, indice) => (
                      <Cell key={ponto.nome} fill={coresDonut[indice % coresDonut.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
        </div>
      ) : (
        <div className={estilos.semFonte} role="status">
          Sem fonte confirmada para as classificações e associações de materiais desta aba. Os gráficos aparecem com dados demonstrativos quando o modo de demonstração está ativo.
        </div>
      )}
    </section>
  )
}

function GraficoClassificacao({
  dados,
  nome,
}: {
  dados: { classificacao: string; quantidade: number }[]
  nome: string
}) {
  return (
    <div className={estilos.grafico} role="img" aria-label={`Quantidade de itens por ${nome.toLowerCase()}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 12, right: 16, bottom: 22, left: 4 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="classificacao" label={{ value: nome, position: 'insideBottom', offset: -8 }} />
          <YAxis allowDecimals={false} label={{ value: 'Quantidade de itens', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend verticalAlign="top" align="right" />
          <Bar dataKey="quantidade" name={nome} radius={[2, 2, 0, 0]}>
            {dados.map((ponto) => (
              <Cell key={ponto.classificacao} fill={ponto.classificacao === 'Sim' ? cores.sim : cores.principal} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function GraficoAssociacoes({
  dados,
}: {
  dados: { material: string; quantidade: number }[]
}) {
  const agrupados = useMemo(() => {
    const contagem = new Map<string, number>()
    dados.forEach((associacao) => contagem.set(associacao.material, (contagem.get(associacao.material) ?? 0) + 1))
    return [...contagem].map(([material, quantidade]) => ({ material, quantidade }))
  }, [dados])

  return (
    <div className={estilos.grafico} role="img" aria-label="Quantidade de associações por material">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={agrupados} layout="vertical" margin={{ top: 8, right: 18, bottom: 8, left: 12 }}>
          <CartesianGrid stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" allowDecimals={false} label={{ value: 'Associações de itens', position: 'insideBottom', offset: -4 }} />
          <YAxis type="category" dataKey="material" width={126} />
          <Tooltip />
          <Bar dataKey="quantidade" name="Associações" fill={cores.principal} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function GraficoPorCondicao({
  dados,
  legenda,
}: {
  dados: { condicao: string; sim: number; nao: number }[]
  legenda: string
}) {
  return (
    <div className={estilos.grafico} role="img" aria-label={`Itens por condição e classificação: ${legenda}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 14, right: 20, bottom: 18, left: 4 }}>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="condicao" label={{ value: 'Condição do item', position: 'insideBottom', offset: -8 }} />
          <YAxis allowDecimals={false} label={{ value: 'Quantidade de itens', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend verticalAlign="top" align="right" />
          <Bar dataKey="nao" name={`${legenda}: Não`} stackId="classificacao" fill={cores.principal} />
          <Bar dataKey="sim" name={`${legenda}: Sim`} stackId="classificacao" fill={cores.sim} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
