import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { EstadoErro } from '../../components/EstadoErro'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useToast } from '../../hooks/useToast'
import { ApiError, describeApiError } from '../../utils/apiError'
import { ItemActionButtons } from '../../components/ItemActionButtons'
import { ItemDialogHost } from '../../components/ItemDialogHost'
import { StatusPill } from '../../components/StatusPill'
import styles from '../../../styles/components/Items/Items.module.css'
import { useItem } from '../../hooks/useItemQueries'
import { Facts } from '../../components/Facts'
import { Timeline } from '../../components/Timeline'
import { useItemController } from '../../hooks/useItemController'
import { fieldLabel } from '../../utils/itemLabels'


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
          <section className={styles.panel} aria-labelledby="item-history"><h2 id="item-history">Histórico</h2><Timeline key={data.id} itemId={data.id} version={data.updatedAt} /></section>
        </>
      )}

      <ItemDialogHost target={target} onTarget={setTarget} notify={notify} />
      <Toast mensagem={toast} />
    </div>
  )
}
