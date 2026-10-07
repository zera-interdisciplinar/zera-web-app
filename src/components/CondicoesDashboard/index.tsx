import { useCondicoesDashboard } from '../../hooks/useCondicoesDashboard'
import { GraficoDados } from '../GraficoDados'
import { Skeleton } from '../Skeleton'
import { EstadoErro } from '../EstadoErro'

export function CondicoesDashboard() {
  const itens = useCondicoesDashboard()
  return <>
    {itens.carregando && <Skeleton descricao="Carregando condições dos itens…" linhas={2} />}
    {itens.erro && <EstadoErro mensagem={itens.erro} aoTentarNovamente={itens.recarregar} />}
    {itens.dados && <GraficoDados titulo="Itens por condição" eixo="Condição" unidade="itens" vazio="Nenhum item disponível para sua conta." pontos={itens.dados} />}
  </>
}
