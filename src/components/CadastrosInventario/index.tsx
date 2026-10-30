import { useProdutos } from '../../hooks/useProdutos'
import { interpretarData } from '../../utils/formatacao'
import { EstadoErro } from '../EstadoErro'
import { GraficoDados } from '../GraficoDados'
import { Skeleton } from '../Skeleton'

export function CadastrosInventario() {
  const itens = useProdutos()
  const meses = new Map<string, number>()
  for (const item of itens.dados ?? []) {
    const data = interpretarData(item.dataEntrada)
    const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
    meses.set(mes, (meses.get(mes) ?? 0) + 1)
  }
  const pontos = Array.from(meses, ([rotulo, valor]) => ({ rotulo, valor })).sort((a, b) => a.rotulo.localeCompare(b.rotulo))
  return <section aria-label="Cadastros do inventário">
    <p>Calculado pela data de cadastro dos itens ativos disponíveis para sua conta; itens descartados ou removidos não estão nesta contagem.</p>
    {itens.carregando && <Skeleton descricao="Carregando cadastros…" linhas={2} />}
    {itens.erro && <EstadoErro mensagem={itens.erro} aoTentarNovamente={itens.recarregar} />}
    {itens.dados && <GraficoDados titulo="Evolução mensal dos cadastros" eixo="Mês" unidade="itens ativos" vazio="Nenhum item ativo disponível para sua conta." pontos={pontos} />}
  </section>
}
