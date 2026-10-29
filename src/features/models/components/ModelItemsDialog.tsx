import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EstadoErro } from '../../../components/EstadoErro'
import { Skeleton } from '../../../components/Skeleton'
import { describeApiError } from '../../../shared/api/errors'
import { Dialog } from '../../../shared/ui/Dialog'
import { Pagination } from '../../../shared/ui/Pagination'
import { StatusPill } from '../../items/components/StatusPill'
import type { Model } from '../../items/schemas/item'
import { useModelItems } from '../hooks/queries'
import styles from './Models.module.css'

export function ModelItemsDialog({ model, onClose }: { model: Model; onClose: () => void }) {
  const [page, setPage] = useState(0)
  const items = useModelItems(model.id, page)
  const data = items.data
  return (
    <Dialog open title={`Itens do modelo ${model.name}`} onClose={onClose} width={36}>
      {items.isPending && <Skeleton descricao="Carregando itens…" linhas={3} />}
      {items.isError && !data && <EstadoErro mensagem={describeApiError(items.error)} aoTentarNovamente={() => void items.refetch()} />}
      {data && data.content.length === 0 && <p className={styles.muted}>Nenhum item usa este modelo.</p>}
      {data && data.content.length > 0 && (
        <>
          <ul className={styles.itemList}>
            {data.content.map((item) => (
              <li key={item.id}>
                <Link to={`/itens/${item.id}`}>{item.name ?? item.displayCode ?? item.barcode}</Link>
                <StatusPill status={item.status} />
              </li>
            ))}
          </ul>
          {data.totalPages > 1 && <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} size={20} sizes={[20]} onPage={setPage} onSize={() => undefined} />}
        </>
      )}
    </Dialog>
  )
}
