import type { GraficoDadosProps } from '../../types/componentes/GraficoDados'
import { BarChart } from '../BarChart'
import { SeloDemonstracao } from '../DashboardTabs/SeloDemonstracao'
import estilos from '../../../styles/components/DashboardTabs/ChartCard.module.css'
import { formatarNumero } from '../../utils/formatarDashboard'

export function GraficoDados({ titulo, pontos, unidade, eixo, vazio, semDados, demo }: GraficoDadosProps) {
  const ultimoPositivo = pontos.filter(ponto => ponto.valor > 0).at(-1)
  return <section className={estilos.cartao} aria-label={`${titulo} · gráfico`}>
    <h2 className={estilos.titulo}>{titulo}</h2>
    {demo && <SeloDemonstracao />}
    <p className={estilos.nota}>Valores em {unidade}.</p>
    {pontos.length > 4 && ultimoPositivo && <p className={estilos.nota}>Último ponto com valor: {ultimoPositivo.rotulo} — {formatarNumero(ultimoPositivo.valor, 2)} ({unidade}). Role o gráfico para ver todos os pontos.</p>}
    {pontos.some((ponto) => ponto.valor > 0)
      ? <BarChart pontos={pontos} maximoEixo={Math.max(1, ...pontos.map((ponto) => ponto.valor))} descricao={titulo} rotuloValor={unidade} rotuloEixo={eixo} />
      : <p role="status">{pontos.length === 0 && semDados ? semDados : vazio}</p>}
  </section>
}
