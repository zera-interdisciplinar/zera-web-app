import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatCount, formatMonth } from '../model/format'
import type { DashboardSnapshot } from '../schemas/snapshot'
import styles from './Dashboard.module.css'

type Point = DashboardSnapshot['itens_por_mes'][number]

const REGISTERED = '#162F71'
const FORWARDED = '#25B988'

export function MonthlyBars({ points, rangeLabel }: { points: Point[]; rangeLabel: string }) {
  const data = points.map((point) => ({ ...point, label: formatMonth(point.mes) }))
  const total = points.reduce((sum, point) => sum + point.cadastrados, 0)
  return (
    <figure className={styles.card} aria-labelledby="monthly-title">
      <figcaption>
        <h2 id="monthly-title" className={styles.cardTitle}>Itens por mês</h2>
        <p className={styles.cardSubtitle}>{rangeLabel}</p>
        <ul className={styles.legend} aria-label="Legenda">
          <li><span className={styles.dot} style={{ background: REGISTERED }} aria-hidden="true" /> Cadastrados</li>
          <li><span className={styles.dot} style={{ background: FORWARDED }} aria-hidden="true" /> Encaminhados</li>
        </ul>
      </figcaption>
      {points.length === 0 ? (
        <p role="status" className={styles.empty}>Nenhum item registrado neste período.</p>
      ) : (
        <>
          <div className={styles.chart} role="img" aria-label={`Itens por mês: ${formatCount(total)} cadastrados em ${points.length} meses. Os valores estão na tabela abaixo.`}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid vertical={false} stroke="#D8E0EE" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#5C6980', fontSize: 11 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#5C6980', fontSize: 11 }} width={32} />
                <Tooltip cursor={{ fill: 'rgb(22 47 113 / 0.06)' }} />
                <Bar dataKey="cadastrados" name="Cadastrados" fill={REGISTERED} radius={[8, 8, 0, 0]} isAnimationActive={false} />
                <Bar dataKey="encaminhados" name="Encaminhados" fill={FORWARDED} radius={[8, 8, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <details className={styles.data}>
            <summary>Ver dados do gráfico</summary>
            <table>
              <caption className="somente-leitor-de-tela">Itens cadastrados e encaminhados por mês</caption>
              <thead><tr><th scope="col">Mês</th><th scope="col" className={styles.num}>Cadastrados</th><th scope="col" className={styles.num}>Encaminhados</th></tr></thead>
              <tbody>
                {points.map((point) => (
                  <tr key={point.mes}><th scope="row">{formatMonth(point.mes)}</th><td className={styles.num}>{formatCount(point.cadastrados)}</td><td className={styles.num}>{formatCount(point.encaminhados)}</td></tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </figure>
  )
}
