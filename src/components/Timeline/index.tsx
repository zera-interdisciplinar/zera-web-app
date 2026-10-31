import { useState } from 'react'
import { useItemEvents, EVENTS_PAGE_SIZE } from '../../hooks/useItemEvents'
import { formatDateTime } from '../../utils/format'
import { EVENT_LABEL, STATUS_LABEL } from '../../utils/itemLabels'
import styles from '../../../styles/components/Items/Items.module.css'
import type { TimelineProps } from '../../types/componentes/Timeline'
import { EstadoErro } from '../EstadoErro'
import { Pagination } from '../Pagination'
import { Skeleton } from '../Skeleton'

export function Timeline({ itemId, version }: TimelineProps) {
  const [page, setPage] = useState(0)
  const events = useItemEvents(itemId, page, version)
  if (events.loading && !events.data) return <Skeleton descricao="Carregando histórico…" linhas={3} />
  if (events.error && !events.data) return <EstadoErro mensagem={events.error} aoTentarNovamente={events.reload} />
  const data = events.data
  if (!data || data.content.length === 0) return <p className={styles.muted}>Ainda não há eventos para este item.</p>
  return (
    <>
      <ol className={styles.timeline}>
        {data.content.map((event) => (
          <li key={event.id}>
            <strong>{EVENT_LABEL[event.type] ?? STATUS_LABEL[event.toStatus ?? 'DRAFT']}</strong>
            {event.fromStatus && event.toStatus && <span>{STATUS_LABEL[event.fromStatus]} → {STATUS_LABEL[event.toStatus]}</span>}
            {event.reason && <span> · Motivo: {event.reason}</span>}
            <small>{event.actorName ?? 'Sistema'} · {formatDateTime(event.occurredAt)}</small>
          </li>
        ))}
      </ol>
      {data.totalPages > 1 && <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} size={EVENTS_PAGE_SIZE} sizes={[EVENTS_PAGE_SIZE]} onPage={setPage} onSize={() => undefined} />}
    </>
  )
}
