import { useId } from 'react'
import estilos from '../../../styles/components/PesoMensal/PesoMensal.module.css'
import type { PesoMensalProps } from '../../types/componentes/PesoMensal'
import { formatarNumero } from '../../utils/formatarDashboard'

export function PesoMensal({ pontos }: PesoMensalProps) {
  const id = useId()
  if (!pontos.some((ponto) => ponto.weightKg > 0)) return <section><h2>Peso descartado por mês</h2><p>Nenhum descarte registrado nos últimos 12 meses</p></section>
  const teto = Math.max(...pontos.map((ponto) => ponto.weightKg)) * 1.15
  const largura = Math.max(280, pontos.length * 52 + 70)
  const agora = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit' }).format(new Date())
  function mes(valor: string) {
    const data = new Date(`${valor}-15T12:00:00Z`)
    return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(data).replace('. de ', '/').replace(' de ', '/').replace('.', '')
  }
  return <section className={estilos.cartao} aria-labelledby={`${id}-titulo`}>
    <h2 id={`${id}-titulo`}>Peso descartado por mês</h2>
    <p>Valores em kg. O mês atual aparece com listras e a indicação “atual”.</p>
    <div className={estilos.rolagem} tabIndex={0} role="region" aria-label="Gráfico mensal; role horizontalmente para ver todos os meses">
      <svg viewBox={`0 0 ${largura} 300`} width={largura} height="300" role="img" aria-label="Peso mensal em quilogramas. Os valores também estão na tabela abaixo.">
        <defs><pattern id={`${id}-padrao`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" className={estilos.fundoPadrao} /><line y2="6" className={estilos.listra} strokeWidth="2" /></pattern></defs>
        {[0, 1, 2, 3, 4].map((marca) => <g key={marca}><line x1="55" x2={largura - 8} y1={240 - marca * 52} y2={240 - marca * 52} className={estilos.grade} /><text x="48" y={244 - marca * 52} textAnchor="end" fontSize="12">{formatarNumero(teto * marca / 4, 1)}</text></g>)}
        <text x="12" y="17" fontSize="13">kg</text>
        {pontos.map((ponto, indice) => {
          const altura = ponto.weightKg / teto * 208
          const x = 64 + indice * ((largura - 70) / pontos.length)
          const atual = ponto.month === agora
          return <g key={ponto.month}>
            <rect x={x} y={240 - altura} width="30" height={altura} fill={atual ? `url(#${id}-padrao)` : undefined} className={atual ? undefined : estilos.barra} />
            <text x={x + 15} y={233 - altura} textAnchor="middle" fontSize="12">{formatarNumero(ponto.weightKg, 2)}</text>
            <text x={x + 15} y="264" textAnchor="middle" fontSize="12">{mes(ponto.month)}</text>
            {atual && <text x={x + 15} y="283" textAnchor="middle" fontSize="12">atual</text>}
          </g>
        })}
      </svg>
    </div>
    <details><summary>Ver em tabela</summary><table><caption>Peso descartado por mês em quilogramas</caption><thead><tr><th scope="col">Mês</th><th scope="col">Peso (kg)</th></tr></thead><tbody>{pontos.map((ponto) => <tr key={ponto.month}><th scope="row">{mes(ponto.month)}</th><td>{formatarNumero(ponto.weightKg, 2)}</td></tr>)}</tbody></table></details>
  </section>
}
