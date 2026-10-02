import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, Package, Recycle, TriangleAlert } from 'lucide-react'
import { BarChart } from '../../components/BarChart'
import { DataTable } from '../../components/DataTable'
import type { Coluna } from '../../components/DataTable'
import { DonutChart } from '../../components/DonutChart'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { FilterChip } from '../../components/FilterChip'
import { KpiCard } from '../../components/KpiCard'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { Skeleton } from '../../components/Skeleton'
import { StatusText } from '../../components/StatusText'
import { useCategorias } from '../../hooks/useCategorias'
import { useProdutos } from '../../hooks/useProdutos'
import { useRequisicao } from '../../hooks/useRequisicao'
import { listarAlertasDeLote } from '../../services/alertaService'
import { modoDemonstracao } from '../../services/apiReal'
import { obterResumoDashboard } from '../../services/dashboardService'
import type { AlertaLote } from '../../types/alerta'
import type { ResumoDashboard } from '../../types/dashboard'
import type { ProdutoDetalhado } from '../../types/produto'
import { formatarDataRelativa, pluralizar } from '../../utils/formatacao'
import estilos from './DashboardPage.module.css'

interface FiltroAtividade {
  recorte: 'todos' | 'pendentes'
  categoriaId: number | string | null
}

export default function DashboardPage() {
  const navegar = useNavigate()

  const buscarResumo = useCallback((sinal: AbortSignal) => obterResumoDashboard(sinal), [])
  const buscarAlertas = useCallback((sinal: AbortSignal) => listarAlertasDeLote(sinal), [])
  const resumo = useRequisicao<ResumoDashboard>(buscarResumo)
  const alertas = useRequisicao<AlertaLote[]>(buscarAlertas, modoDemonstracao)
  const produtos = useProdutos()
  const categorias = useCategorias()

  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<FiltroAtividade>({ recorte: 'todos', categoriaId: null })

  const recentes = useMemo<ProdutoDetalhado[]>(() => {
    const dados = produtos.dados ?? []
    return dados
      .filter((produto) => {
        if (filtro.recorte === 'pendentes' && produto.status !== 'em-aprovacao') return false
        if (filtro.categoriaId !== null && produto.categoriaId !== filtro.categoriaId) return false
        return true
      })
      .slice(0, 8)
  }, [produtos.dados, filtro])

  const colunas = useMemo<Coluna<ProdutoDetalhado>[]>(
    () => [
      {
        titulo: 'Item',
        render: (produto) => (
          <Link className={estilos.linkItem} to={`/itens/${produto.id}`}>
            {produto.marca} {produto.nome}
          </Link>
        ),
      },
      { titulo: 'Categoria', render: (produto) => produto.categoriaNome },
      { titulo: 'Status', render: (produto) => <StatusText status={produto.status} /> },
      { titulo: 'Atualização', render: (produto) => formatarDataRelativa(produto.atualizacao) },
    ],
    [],
  )

  const kpis = resumo.dados?.kpis
  const totalCriticos = (alertas.dados ?? []).reduce((total, alerta) => total + alerta.quantidadeItens, 0)

  return (
    <>
      <PageHeader
        titulo="Visão geral"
        subtitulo="Acompanhe inventário, descarte e impacto ambiental."
      />

      <div className={estilos.toolbar}>
        <SearchInput
          id="busca-painel"
          rotulo="Pesquisar item por ID, nome ou material"
          valor={busca}
          aoMudar={setBusca}
          aoEnviar={() => navegar(`/itens?q=${encodeURIComponent(busca.trim())}`)}
        />
        <div className={estilos.chips} role="group" aria-label="Recorte da atividade recente">
          <FilterChip
            rotulo="Todos"
            ativo={filtro.recorte === 'todos'}
            aoClicar={() => setFiltro((atual) => ({ ...atual, recorte: 'todos' }))}
          />
          <FilterChip
            rotulo="Pendentes"
            ativo={filtro.recorte === 'pendentes'}
            aoClicar={() => setFiltro((atual) => ({ ...atual, recorte: 'pendentes' }))}
          />
          <FilterChip
            rotulo="Categoria"
            opcoes={[
              { valor: 'todas', rotulo: 'Todas as categorias' },
              ...(categorias.dados ?? []).map((categoria) => ({
                valor: String(categoria.id),
                rotulo: categoria.nome,
              })),
            ]}
            valorAtual={filtro.categoriaId === null ? 'todas' : String(filtro.categoriaId)}
            aoSelecionar={(valor) =>
              setFiltro((atual) => ({
                ...atual,
                categoriaId: valor === 'todas' ? null : modoDemonstracao ? Number(valor) : valor,
              }))
            }
          />
        </div>
      </div>

      {resumo.carregando && <Skeleton descricao="Carregando os indicadores do painel." linhas={3} />}
      {resumo.erro && <EstadoErro mensagem={resumo.erro} aoTentarNovamente={resumo.recarregar} />}

      {kpis && (
        <section className={estilos.gradeKpis} aria-label="Indicadores do estoque">
          <KpiCard
            rotulo={resumo.dados?.origem === 'api' ? 'Itens ativos' : 'Itens cadastrados'}
            valor={kpis.itensCadastrados.toLocaleString('pt-BR')}
            delta={kpis.deltaItens}
            tomDelta="navy"
            Icone={Package}
            fundoIcone="navy"
          />
          <KpiCard
            rotulo="Taxa de reciclagem"
            valor={`${kpis.taxaReciclagem}%`}
            delta={kpis.deltaReciclagem}
            tomDelta="verde"
            Icone={Recycle}
            fundoIcone="verde"
          />
          <KpiCard
            rotulo="Aguardando aprovação"
            valor={String(kpis.aguardandoAprovacao)}
            delta={resumo.dados?.origem === 'api' ? `${kpis.prioritarios} em manutenção` : `${kpis.prioritarios} prioritários`}
            tomDelta="ambar"
            Icone={TriangleAlert}
            fundoIcone="ambar"
          />
          <KpiCard
            rotulo={resumo.dados?.origem === 'api' ? 'Peso descartado' : 'Impacto recuperado'}
            valor={`${String(kpis.impactoToneladas).replace('.', ',')} t`}
            delta={resumo.dados?.origem === 'api' ? 'Destinações registradas' : 'Materiais recuperados'}
            tomDelta="navy"
            Icone={Leaf}
            fundoIcone="navy"
          />
        </section>
      )}

      {resumo.dados && (
        <div className={estilos.gradePrincipal}>
          <section className={estilos.cartao} aria-labelledby="titulo-serie">
            <div className={estilos.topoCartao}>
              <div>
                <h2 className="titulo-card" id="titulo-serie">
                  {resumo.dados.origem === 'api' ? 'Peso descartado por mês (kg)' : 'Itens por mês'}
                </h2>
                <p className={estilos.subtituloCartao}>{resumo.dados.origem === 'api' ? 'Período retornado pela API' : 'Últimos 6 meses'}</p>
              </div>
              <p className={estilos.legenda}>
                <span className={estilos.ponto} aria-hidden="true" /> {resumo.dados.origem === 'api' ? 'Descartados' : 'Cadastrados'}
              </p>
            </div>
            <BarChart
              pontos={resumo.dados.serie.map((ponto) => ({
                rotulo: ponto.mes,
                valor: ponto.total,
                destaque: ponto.atual,
              }))}
              maximoEixo={Math.max(1, ...resumo.dados.serie.map((ponto) => ponto.total))}
              rotuloValor={resumo.dados.origem === 'api' ? 'Quilogramas descartados' : 'Itens cadastrados'}
              descricao={`${resumo.dados.origem === 'api' ? 'Peso descartado em quilogramas' : 'Itens cadastrados'} por mês: ${resumo.dados.serie
                .map((ponto) => `${ponto.mes} ${ponto.total}`)
                .join(', ')}.`}
            />
          </section>

          {resumo.dados.origem !== 'api' && <section className={estilos.cartao} aria-labelledby="titulo-circularidade">
            <h2 className="titulo-card" id="titulo-circularidade">
              Circularidade
            </h2>
            <p className={estilos.subtituloCartao}>Meta anual</p>
            <DonutChart
              percentual={resumo.dados.circularidade.percentual}
              meta={resumo.dados.circularidade.meta}
            />
          </section>}
        </div>
      )}

      <section className={estilos.cartao} aria-labelledby="titulo-recentes">
        <div className={estilos.topoCartao}>
          <h2 className="titulo-card" id="titulo-recentes">
            Atividade recente
          </h2>
          <Link className={estilos.verTudo} to="/itens">
            Ver todos os itens
          </Link>
        </div>

        {alertas.dados && totalCriticos > 0 && (
          <p className={estilos.alertaLote}>
            {totalCriticos} {pluralizar(totalCriticos, 'item passou', 'itens passaram')} do limite
            de permanência da categoria.{' '}
            <Link to="/itens?status=lote-critico">Ver itens em lote crítico</Link>
          </p>
        )}

        {produtos.carregando && <Skeleton descricao="Carregando a atividade recente." linhas={4} />}
        {produtos.erro && <EstadoErro mensagem={produtos.erro} aoTentarNovamente={produtos.recarregar} />}

        {produtos.dados && recentes.length === 0 && (
          <EmptyState
            titulo="Nenhum item nesse recorte"
            descricao="Os filtros da toolbar não combinam com nenhum item recente. Ajuste o recorte ou cadastre um novo item."
          />
        )}

        {recentes.length > 0 && (
          <DataTable
            colunas={colunas}
            dados={recentes}
            chave={(produto) => produto.id}
            legenda="Itens atualizados mais recentemente"
          />
        )}
      </section>
    </>
  )
}
