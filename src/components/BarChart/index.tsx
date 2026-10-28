import type { BarChartProps } from '../../types/componentes/BarChart'
export type { PontoBarra, BarChartProps } from '../../types/componentes/BarChart'
import estilos from '../../../styles/components/BarChart/BarChart.module.css'
import { formatarNumero } from '../../utils/formatarDashboard'

const ALTURA = 270
const BASE = 230
const ALTURA_UTIL = 220
const LARGURA_BARRA = 56

export function BarChart({ pontos, maximoEixo, descricao, rotuloValor = 'Itens cadastrados', rotuloEixo = 'Mês' }: BarChartProps) {
  const marcas = Array.from({ length: 5 }, (_, indice) => (maximoEixo / 4) * indice)
  const areaPlotagem = Math.max(520, pontos.length * 100)
  const largura = areaPlotagem + 80
  const slot = areaPlotagem / pontos.length

  return (
    <div className={estilos.envoltorio} role="region" aria-label={`${descricao}; área rolável`} tabIndex={0}>
      <svg
        viewBox={`0 0 ${largura} ${ALTURA}`}
        width={largura}
        role="img"
        aria-label={descricao}
        className={estilos.grafico}
      >
        {pontos.map((ponto, indice) => {
          const altura = (ponto.valor / maximoEixo) * ALTURA_UTIL
          const x = indice * slot + (slot - LARGURA_BARRA) / 2
          return (
            <g key={ponto.id ?? ponto.rotulo}>
              <rect
                x={x}
                y={BASE - altura}
                width={LARGURA_BARRA}
                height={altura}
                rx={10}
                className={ponto.destaque ? estilos.barraDestaque : estilos.barra}
              />
              <text x={x + LARGURA_BARRA / 2} y={BASE + 24} textAnchor="middle" className={estilos.rotuloMes}>
                <title>{ponto.rotulo}</title>{ponto.rotulo.length > 15 ? `${ponto.rotulo.slice(0, 14)}…` : ponto.rotulo}
              </text>
            </g>
          )
        })}
        {marcas.map((marca) => (
          <text
            key={marca}
            x={areaPlotagem + 24}
            y={BASE - (marca / maximoEixo) * ALTURA_UTIL + 4}
            className={estilos.marcaEixo}
          >
            {formatarNumero(marca, 2)}
          </text>
        ))}
      </svg>

      <details>
      <summary>Consultar os dados do gráfico</summary>
      <table>
        <caption>{descricao}</caption>
        <thead>
          <tr>
            <th scope="col">{rotuloEixo}</th>
            <th scope="col">{rotuloValor}</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((ponto) => (
            <tr key={ponto.id ?? ponto.rotulo}>
              <th scope="row">{ponto.rotulo}</th>
              <td>{formatarNumero(ponto.valor, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </details>
    </div>
  )
}
