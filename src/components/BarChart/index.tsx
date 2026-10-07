import type { BarChartProps } from '../../types/componentes/BarChart'
export type { PontoBarra, BarChartProps } from '../../types/componentes/BarChart'
import estilos from '../../../styles/components/BarChart/BarChart.module.css'

const LARGURA = 600
const ALTURA = 270
const BASE = 230
const ALTURA_UTIL = 220
const LARGURA_BARRA = 56
const AREA_PLOTAGEM = 520

export function BarChart({ pontos, maximoEixo, descricao, rotuloValor = 'Itens cadastrados' }: BarChartProps) {
  const marcas = Array.from({ length: 5 }, (_, indice) => (maximoEixo / 4) * indice)
  const slot = AREA_PLOTAGEM / pontos.length

  return (
    <div className={estilos.envoltorio}>
      <svg
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        role="img"
        aria-label={descricao}
        className={estilos.grafico}
      >
        {pontos.map((ponto, indice) => {
          const altura = Math.max(4, (ponto.valor / maximoEixo) * ALTURA_UTIL)
          const x = indice * slot + (slot - LARGURA_BARRA) / 2
          return (
            <g key={ponto.rotulo}>
              <rect
                x={x}
                y={BASE - altura}
                width={LARGURA_BARRA}
                height={altura}
                rx={10}
                className={ponto.destaque ? estilos.barraDestaque : estilos.barra}
              />
              <text x={x + LARGURA_BARRA / 2} y={BASE + 24} textAnchor="middle" className={estilos.rotuloMes}>
                {ponto.rotulo}
              </text>
            </g>
          )
        })}
        {marcas.map((marca) => (
          <text
            key={marca}
            x={AREA_PLOTAGEM + 24}
            y={BASE - (marca / maximoEixo) * ALTURA_UTIL + 4}
            className={estilos.marcaEixo}
          >
            {marca}
          </text>
        ))}
      </svg>

      <details>
      <summary>Consultar os dados do gráfico</summary>
      <table>
        <caption>{descricao}</caption>
        <thead>
          <tr>
            <th scope="col">Mês</th>
            <th scope="col">{rotuloValor}</th>
          </tr>
        </thead>
        <tbody>
          {pontos.map((ponto) => (
            <tr key={ponto.rotulo}>
              <th scope="row">{ponto.rotulo}</th>
              <td>{ponto.valor}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </details>
    </div>
  )
}
