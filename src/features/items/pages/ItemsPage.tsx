import { Plus } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/Button'
import type { Coluna } from '../../../components/DataTable'
import { DataTable } from '../../../components/DataTable'
import { EmptyState } from '../../../components/EmptyState'
import { EstadoErro } from '../../../components/EstadoErro'
import { PageHeader } from '../../../components/PageHeader'
import { SearchInput } from '../../../components/SearchInput'
import { Skeleton } from '../../../components/Skeleton'
import { Toast } from '../../../components/Toast'
import { useToast } from '../../../hooks/useToast'
import { describeApiError } from '../../../shared/api/errors'
import { formatRelativeTime, NOT_AVAILABLE } from '../../../shared/format'
import { Pagination } from '../../../shared/ui/Pagination'
import { ItemActionButtons } from '../components/ItemActionButtons'
import { ItemDialogHost } from '../components/ItemDialogHost'
import { StatusPill } from '../components/StatusPill'
import styles from '../components/Items.module.css'
import { useCategories, useItemsList } from '../hooks/queries'
import { useItemController } from '../hooks/useItemController'
import { useItemFilters } from '../hooks/useItemFilters'
import { PAGE_SIZES } from '../model/filters'
import { STATUS_LABEL } from '../model/labels'
import { ITEM_STATUSES, type ItemResponse, type ItemStatus } from '../schemas/item'

export default function ItemsPage() {
  const { filters, search, setSearch, apply, clear, dirty } = useItemFilters()
  const [toast, notify] = useToast()
  const { target, setTarget, onAction, busy } = useItemController(notify)
  const list = useItemsList(filters)
  const categories = useCategories()

  // The column definitions depend on the action handler only.
  const columns = useMemo<Coluna<ItemResponse>[]>(() => [
    { titulo: 'Item', render: (item) => (
      <>
        <Link className={styles.link} to={`/itens/${item.id}`}>{item.name ?? 'Sem nome'}</Link>
        <span className={styles.code}>{item.displayCode ?? item.barcode}</span>
      </>
    ) },
    { titulo: 'Categoria', render: (item) => item.model?.category.name ?? NOT_AVAILABLE },
    { titulo: 'Status', render: (item) => <StatusPill status={item.status} /> },
    { titulo: 'Responsável', render: (item) => item.createdByName ?? NOT_AVAILABLE },
    { titulo: 'Atualização', render: (item) => formatRelativeTime(item.updatedAt) },
    { titulo: 'Ação', render: (item) => <ItemActionButtons item={item} compact disabled={busy} onAction={onAction} /> },
  ], [busy, onAction])

  const page = list.data
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <PageHeader titulo="Gestão de itens" subtitulo="Cadastre, filtre e acompanhe o ciclo de cada item." />
        <Button onClick={() => setTarget({ kind: 'create' })}><Plus aria-hidden="true" size={18} /> Adicionar item</Button>
      </div>

      <div className={styles.toolbar} role="search" aria-label="Filtrar itens">
        <SearchInput id="items-search" rotulo="Pesquisar por código, nome, modelo ou material" valor={search} aoMudar={setSearch} placeholder="Pesquisar por ID, Nome ou Material..." />
        <label className={styles.field}>Status
          <select value={filters.status ?? ''} onChange={(event) => apply({ status: (event.target.value || undefined) as ItemStatus | undefined })}>
            <option value="">Ativos</option>
            {ITEM_STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
          </select>
        </label>
        <label className={styles.field}>Categoria
          <select value={filters.categoryId ?? ''} onChange={(event) => apply({ categoryId: event.target.value || undefined })}>
            <option value="">Todas</option>
            {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        {dirty && <button type="button" className={styles.clear} onClick={clear}>Limpar filtros</button>}
      </div>

      <section className={styles.card} aria-labelledby="items-title" aria-busy={list.isFetching}>
        <h2 id="items-title" className={styles.cardTitle}>Todos os itens</h2>
        {list.isPending && <Skeleton descricao="Carregando itens…" linhas={6} />}
        {list.isError && !page && <EstadoErro mensagem={describeApiError(list.error)} aoTentarNovamente={() => void list.refetch()} />}
        {page && page.content.length === 0 && (
          <EmptyState titulo={dirty ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
            descricao={dirty ? 'Ajuste a busca ou limpe os filtros.' : 'Use “Adicionar item” para cadastrar o primeiro.'} />
        )}
        {page && page.content.length > 0 && (
          <>
            <DataTable legenda="Todos os itens" colunas={columns} dados={page.content} chave={(item) => item.id} />
            <Pagination page={page.page} totalPages={page.totalPages} totalElements={page.totalElements} size={page.size} sizes={PAGE_SIZES}
              onPage={(next) => apply({ page: next })} onSize={(size) => apply({ size })} />
          </>
        )}
        {list.isError && page && <EstadoErro mensagem={describeApiError(list.error)} aoTentarNovamente={() => void list.refetch()} />}
      </section>

      <ItemDialogHost target={target} onTarget={setTarget} notify={notify} />
      <Toast mensagem={toast} />
    </div>
  )
}
