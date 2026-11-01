import type { CapacityOverviewProps } from '../../types/componentes/CapacityOverview'
import { useStockCapacity } from '../../hooks/useStockCapacity'
import { formatCount } from '../../utils/dashboardFormat'
import styles from '../../../styles/pages/SettingsPage/SettingsPage.module.css'

export function CapacityOverview({ capacity }: CapacityOverviewProps) {
  const { count, percent, free, pending, error } = useStockCapacity(capacity)
  return (
    <section className={styles.overview} aria-label="Resumo do estoque">
      <div className={styles.occupancy}>
        <svg className={styles.ring} viewBox="0 0 120 120" aria-hidden="true">
          <circle className={styles.ringTrack} cx="60" cy="60" r="50" />
          <circle className={styles.ringFill} cx="60" cy="60" r="50" pathLength="100" strokeDasharray={`${Math.min(percent ?? 0, 100)} 100`} />
        </svg>
        <div className={styles.ringLabel}>
          <strong>{percent === null ? 'Sem cálculo' : `${percent}%`}</strong>
          <span>de ocupação</span>
        </div>
      </div>
      <dl className={styles.metrics}>
        <div><dt>Capacidade total</dt><dd>{capacity === null ? 'Não configurada' : formatCount(capacity)}</dd></div>
        <div><dt>No estoque</dt><dd>{count === null ? 'Indisponível' : formatCount(count)}</dd></div>
        <div><dt>Vagas disponíveis</dt><dd>{free === null ? 'Indisponível' : formatCount(free)}</dd></div>
      </dl>
      {pending && <p className={styles.summaryNote} role="status">Carregando ocupação…</p>}
      {error && <p className={styles.summaryNote} role="alert">Não foi possível consultar a ocupação atual.</p>}
      {capacity === 0 && <p className={styles.summaryNote}>A capacidade está zerada. Defina um limite para acompanhar a ocupação.</p>}
      {percent !== null && percent > 100 && <p className={styles.summaryNote} role="status">O estoque está acima da capacidade configurada.</p>}
    </section>
  )
}
