import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EstadoErro } from '../EstadoErro'
import { Skeleton } from '../Skeleton'
import { Dialog } from '../Dialog'
import { Pagination } from '../Pagination'
import { StatusPill } from '../StatusPill'
import { MODEL_ITEMS_PAGE_SIZE, useModelItems } from '../../hooks/useModelItems'
import styles from '../../../styles/components/Models/Models.module.css'
import type { ModelItemsDialogProps } from '../../types/componentes/ModelItemsDialog'

export function ModelItemsDialog({ model, onClose }: ModelItemsDialogProps) {
  const [page, setPage] = useState(0)
  const items = useModelItems(model.id, page)
  const data = items.data
  return (
    <Dialog open title={`Itens do modelo ${model.name}`} description={`Lista de itens associados ao modelo ${model.name}.`} onClose={onClose} width={36}>
      {items.loading && !data && <Skeleton descricao="Carregando itens…" linhas={3} />}
      {items.error && !data && <EstadoErro mensagem={items.error} aoTentarNovamente={items.reload} />}
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
          {data.totalPages > 1 && <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} size={MODEL_ITEMS_PAGE_SIZE} sizes={[MODEL_ITEMS_PAGE_SIZE]} onPage={setPage} onSize={() => undefined} />}
        </>
      )}
    </Dialog>
  )
}
