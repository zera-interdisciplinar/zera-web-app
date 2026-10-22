import { useProdutos } from '../../hooks/useProdutos'
import { useDistribuicaoCategoriasDashboard } from '../../hooks/useDadosInventarioDashboard'
import { ROTULO_CONDICAO, ROTULO_STATUS } from '../../types/produto'
import type { PontoBarra } from '../../types/componentes/BarChart'
import { EstadoErro } from '../EstadoErro'
import { GraficoDados } from '../GraficoDados'
import { Skeleton } from '../Skeleton'
import estilos from '../../../styles/components/DashboardTabs/VisaoGeralTab.module.css'

function agrupar(rotulos: string[]): PontoBarra[] {
  const totais = new Map<string, number>()
  for (const rotulo of rotulos) totais.set(rotulo, (totais.get(rotulo) ?? 0) + 1)
  return Array.from(totais, ([rotulo, valor]) => ({ rotulo, valor }))
}

export function DistribuicaoInventario() {
  const itens = useProdutos()
  const categorias = useDistribuicaoCategoriasDashboard()
  return <section aria-label="Distribuição do inventário">
    <p>Os gráficos de situação e condição usam os itens disponíveis para sua conta. Itens por categoria usa os indicadores da unidade. Os filtros da visão geral não se aplicam.</p>
    {itens.carregando && <Skeleton descricao="Carregando itens do inventário…" linhas={2} />}
    {itens.erro && <EstadoErro mensagem={itens.erro} aoTentarNovamente={itens.recarregar} />}
    {itens.dados && <div className={estilos.gradeGraficos}>
      <GraficoDados titulo="Itens por situação" eixo="Situação" unidade="itens" vazio="Nenhum item disponível para sua conta." pontos={agrupar(itens.dados.map(item => ROTULO_STATUS[item.status]))} />
      <GraficoDados titulo="Itens por condição" eixo="Condição" unidade="itens" vazio="Nenhum item disponível para sua conta." pontos={agrupar(itens.dados.map(item => ROTULO_CONDICAO[item.condicao]))} />
    </div>}
    {categorias.carregando && <Skeleton descricao="Carregando itens por categoria…" linhas={2} />}
    {categorias.erro && <EstadoErro mensagem={categorias.erro} aoTentarNovamente={categorias.recarregar} />}
    {categorias.dados && <div className={estilos.gradeGraficos}>
      <GraficoDados titulo="Itens por categoria" eixo="Categoria" unidade="itens" vazio="Nenhum item ativo agrupado por categoria nesta unidade." pontos={categorias.dados.categories.map((categoria) => ({
        rotulo: categoria.name ?? 'Sem categoria',
        valor: categoria.itemCount,
        id: categoria.categoryId ?? 'sem-categoria',
      }))} />
    </div>}
  </section>
}
