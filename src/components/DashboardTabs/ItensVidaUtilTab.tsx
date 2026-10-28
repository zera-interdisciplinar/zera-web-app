import { SeloDemonstracao } from './SeloDemonstracao'
import type { FiltrosDashboard } from '../../types/dashboardAnalytics'
import estilos from '../../../styles/components/DashboardTabs/ItensVidaUtilTab.module.css'
import { useModelosDashboard } from '../../hooks/useDadosInventarioDashboard'
import { DataTable } from '../DataTable'
import { EstadoErro } from '../EstadoErro'
import { formatarNumero } from '../../utils/formatarDashboard'
import { GraficoDados } from '../GraficoDados'
import { CondicoesDashboard } from '../CondicoesDashboard'

export function ItensVidaUtilTab({ demo = false, ativo = false }: { demo?: boolean; filtros?: FiltrosDashboard; ativo?: boolean } = {}) {
  const modelos = useModelosDashboard(ativo)
  return (
    <section className={estilos.sourceState} aria-labelledby="fonte-vida-util" data-estado={modelos.carregando ? 'carregando' : modelos.erro ? 'erro' : 'sucesso'}>
      <h2 id="fonte-vida-util">Itens e vida útil</h2>
      {demo && <SeloDemonstracao />}
      {ativo && <CondicoesDashboard />}
      {modelos.carregando && <p role="status">Carregando características dos modelos…</p>}
      {modelos.erro && <EstadoErro mensagem={modelos.erro} aoTentarNovamente={modelos.recarregar} />}
      {modelos.dados && modelos.dados.length > 0 ? <DataTable
        legenda="Características estimadas por modelo" dados={modelos.dados} chave={(modelo) => modelo.id}
        colunas={[
          { titulo: 'Modelo', render: (modelo) => modelo.nome },
          { titulo: 'Vida útil (meses)', numerica: true, render: (modelo) => formatarNumero(modelo.vidaUtilMeses) },
          { titulo: 'Garantia (meses)', numerica: true, render: (modelo) => formatarNumero(modelo.garantiaMeses) },
          { titulo: 'Peso estimado (kg)', numerica: true, render: (modelo) => formatarNumero(modelo.pesoEstimadoKg, 2) },
        ]}
      /> : !modelos.carregando && !modelos.erro && <p>Ainda não há dados para exibir aqui.</p>}
      {modelos.dados && <>
        <GraficoDados titulo="Vida útil estimada dos modelos" eixo="Modelo" unidade="meses" vazio="As vidas úteis informadas são de zero meses." semDados="Nenhum modelo tem vida útil estimada informada." pontos={modelos.dados.flatMap(m => typeof m.vidaUtilMeses === 'number' ? [{ id: String(m.id), rotulo: m.nome, valor: m.vidaUtilMeses }] : [])} />
        <GraficoDados titulo="Garantia dos modelos" eixo="Modelo" unidade="meses" vazio="As garantias informadas são de zero meses." semDados="Nenhum modelo tem garantia informada." pontos={modelos.dados.flatMap(m => typeof m.garantiaMeses === 'number' ? [{ id: String(m.id), rotulo: m.nome, valor: m.garantiaMeses }] : [])} />
        <GraficoDados titulo="Peso estimado dos modelos" eixo="Modelo" unidade="kg" vazio="Os pesos estimados informados são de zero kg." semDados="Nenhum modelo tem peso estimado informado." pontos={modelos.dados.flatMap(m => typeof m.pesoEstimadoKg === 'number' ? [{ id: String(m.id), rotulo: m.nome, valor: m.pesoEstimadoKg }] : [])} />
      </>}
      <p>As estimativas pertencem aos modelos. A idade de fabricação e a vida útil consumida de cada item ainda não estão disponíveis.</p>
    </section>
  )
}
