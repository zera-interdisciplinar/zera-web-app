import { ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EstadoErro } from '../../../components/EstadoErro'
import { Skeleton } from '../../../components/Skeleton'
import { Toast } from '../../../components/Toast'
import { useToast } from '../../../hooks/useToast'
import { ApiError, describeApiError } from '../../../shared/api/errors'
import { formatDate, formatDateTime, NOT_AVAILABLE } from '../../../shared/format'
import { Pagination } from '../../../shared/ui/Pagination'
import { ItemActionButtons } from '../components/ItemActionButtons'
import { ItemDialogHost } from '../components/ItemDialogHost'
import { StatusPill } from '../components/StatusPill'
import styles from '../components/Items.module.css'
import { useItem, useItemEvents } from '../hooks/queries'
import { useItemController } from '../hooks/useItemController'
import { CONDITION_LABEL, DAMAGE_LABEL, EVENT_LABEL, fieldLabel, MATERIAL_LABEL, STATUS_LABEL } from '../model/labels'
import type { ItemResponse } from '../schemas/item'

const EVENTS_PAGE_SIZE = 20

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt>{label}</dt><dd>{children || NOT_AVAILABLE}</dd></div>
}

function Facts({ item }: { item: ItemResponse }) {
  const model = item.model
  const damages = item.hasDamages ? (item.damages ?? []).map((damage) => DAMAGE_LABEL[damage]).join(', ') || 'Sim' : item.hasDamages === false ? 'Não' : null
  return (
    <dl className={styles.facts}>
      <Fact label="Código de barras">{item.barcode}</Fact>
      <Fact label="Modelo">{model ? `${model.name} — ${model.manufacturer}` : null}</Fact>
      <Fact label="Categoria">{model?.category.name}</Fact>
      <Fact label="Materiais">{model?.materials.length ? model.materials.map((material) => MATERIAL_LABEL[material.code]).join(', ') : null}</Fact>
      <Fact label="Condição">{item.condition ? CONDITION_LABEL[item.condition] : null}</Fact>
      <Fact label="Danos">{damages}</Fact>
      <Fact label="Intensidade de uso">{item.usageIntensity == null ? null : `${item.usageIntensity} de 10`}</Fact>
      <Fact label="Número de série">{item.serialNumber}</Fact>
      <Fact label="Data de aquisição">{item.acquiredAt ? formatDate(item.acquiredAt) : null}</Fact>
      <Fact label="Ano de fabricação">{item.manufacturingYear}</Fact>
      <Fact label="Previsão de falha">{item.predictedFailureDate ? formatDate(item.predictedFailureDate) : 'Sem previsão'}</Fact>
      <Fact label="Cadastrado por">{item.createdByName}</Fact>
      <Fact label="Cadastrado em">{formatDateTime(item.createdAt)}</Fact>
      <Fact label="Última atualização">{formatDateTime(item.updatedAt)}</Fact>
      <Fact label="Observações">{item.notes}</Fact>
    </dl>
  )
}

function Timeline({ itemId }: { itemId: string }) {
  const [page, setPage] = useState(0)
  const events = useItemEvents(itemId, page, true)
  if (events.isPending) return <Skeleton descricao="Carregando histórico…" linhas={3} />
  if (events.isError && !events.data) return <EstadoErro mensagem={describeApiError(events.error)} aoTentarNovamente={() => void events.refetch()} />
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

export default function ItemDetailPage() {
  const { id } = useParams()
  const item = useItem(id ?? '')
  const [toast, notify] = useToast()
  const { target, setTarget, onAction, busy } = useItemController(notify)
  const data = item.data

  if (!id) return <EstadoErro mensagem="Item não informado." />

  return (
    <div className={styles.page}>
      <Link className={styles.back} to="/itens"><ArrowLeft aria-hidden="true" /> Voltar para itens</Link>

      {item.isPending && <Skeleton descricao="Carregando item…" linhas={5} />}
      {item.isError && !data && (
        item.error instanceof ApiError && item.error.status === 404
          ? <EstadoErro mensagem="Não encontramos este item. Ele pode ter sido removido da unidade." />
          : <EstadoErro mensagem={describeApiError(item.error)} aoTentarNovamente={() => void item.refetch()} />
      )}

      {data && (
        <>
          <div className={styles.header}>
            <div>
              <div className={styles.titleRow}>
                <h1 className={styles.title}>{data.name ?? 'Item sem nome'}</h1>
                <StatusPill status={data.status} />
              </div>
              <p className={styles.code}>{data.displayCode ?? data.barcode}</p>
            </div>
            <ItemActionButtons item={data} disabled={busy} onAction={onAction} />
          </div>

          {data.missingFields && data.missingFields.length > 0 && (
            <p className={styles.draftNote} role="status">Faltam dados para concluir o cadastro: {data.missingFields.map(fieldLabel).join(', ')}.</p>
          )}

          <div className={styles.detailGrid}>
            <section className={styles.panel} aria-labelledby="item-data"><h2 id="item-data">Dados do item</h2><Facts item={data} /></section>
            <section className={styles.panel} aria-labelledby="item-photo"><h2 id="item-photo">Foto</h2>
              {data.photoUrl ? <img className={styles.photo} src={data.photoUrl} alt={data.name ?? 'Foto do item'} /> : <div className={styles.photoPlaceholder}>Sem foto enviada pelo app</div>}
            </section>
          </div>
          <section className={styles.panel} aria-labelledby="item-history"><h2 id="item-history">Histórico</h2><Timeline key={data.id} itemId={data.id} /></section>
        </>
      )}

      <ItemDialogHost target={target} onTarget={setTarget} notify={notify} />
      <Toast mensagem={toast} />
    </div>
  )
}
