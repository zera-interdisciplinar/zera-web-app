import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { Coluna } from '../../components/DataTable'
import { DataTable } from '../../components/DataTable'
import { EmptyState } from '../../components/EmptyState'
import { EstadoErro } from '../../components/EstadoErro'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { Skeleton } from '../../components/Skeleton'
import { Toast } from '../../components/Toast'
import { useToast } from '../../hooks/useToast'
import { describeApiError } from '../../utils/apiError'
import { formatRelativeTime, NOT_AVAILABLE } from '../../utils/format'
import { Pagination } from '../../components/Pagination'
import { ItemActionButtons } from '../../components/ItemActionButtons'
import { ItemDialogHost } from '../../components/ItemDialogHost'
import { StatusPill } from '../../components/StatusPill'
import styles from '../../../styles/components/Items/Items.module.css'
import { useCategories, useSelectedItems } from '../../hooks/useItemQueries'
import { useItemController } from '../../hooks/useItemController'
import { useItemFilters } from '../../hooks/useItemFilters'
import { PAGE_SIZES } from '../../utils/itemFilters'
import { STATUS_LABEL } from '../../utils/itemLabels'
import { ITEM_STATUSES } from '../../utils/itemSchemas'
import type { ItemResponse, ItemStatus } from '../../types/item'
import { FilterSheet } from '../../components/FilterSheet'
import { StockManagement } from '../../components/StockManagement'

export default function ItemsPage() {
  const { filters, search, setSearch, apply, clear, dirty } = useItemFilters()
  const [toast, notify] = useToast()
  const { target, setTarget, onAction, busy } = useItemController(notify)
  const list = useSelectedItems(filters)
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
    { titulo: 'Ação', render: (item) => <ItemActionButtons item={item} disabled={busy} onAction={onAction} /> },
  ], [busy, onAction])

  const page = list.data
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <PageHeader titulo="Gestão de itens" subtitulo="Acompanhe os equipamentos, avalie solicitações e gerencie o estoque." />
      </div>

      <div className={styles.toolbar} role="search" aria-label="Filtrar itens">
        <SearchInput id="items-search" rotulo="Pesquisar por código, nome, modelo ou material" valor={search} aoMudar={setSearch} placeholder="Pesquisar por ID, Nome ou Material..." />
        <FilterSheet title="Filtrar itens" groups={[
          { id: 'statuses', label: 'Status', multiple: true, selected: filters.statuses, options: ITEM_STATUSES.map((status) => ({ value: status, label: STATUS_LABEL[status] })) },
          { id: 'categoryIds', label: 'Categoria', multiple: true, selected: filters.categoryIds, options: (categories.data ?? []).map((category) => ({ value: category.id, label: category.name })) },
        ]} onApply={(selection) => apply({ statuses: (selection.statuses ?? []) as ItemStatus[], categoryIds: selection.categoryIds ?? [] })} onClear={clear} />
        {dirty && !filters.statuses.length && !filters.categoryIds.length && <button type="button" className={styles.clear} onClick={clear}>Limpar filtros</button>}
      </div>

      <StockManagement />

      <section className={styles.card} aria-labelledby="items-title" aria-busy={list.isFetching}>
        <h2 id="items-title" className={styles.cardTitle}>Todos os itens</h2>
        {list.isFetching && !list.isPending && <p role="status" className={styles.loading}>Atualizando resultados…</p>}
        {list.isPending && <Skeleton descricao="Carregando itens…" linhas={6} />}
        {list.isError && !page && <EstadoErro mensagem={describeApiError(list.error)} aoTentarNovamente={() => void list.refetch()} />}
        {page && page.content.length === 0 && (
          <EmptyState titulo={dirty ? 'Nenhum item encontrado' : 'Nenhum item cadastrado'}
            descricao={dirty ? 'Ajuste a busca ou limpe os filtros.' : 'Os itens cadastrados pelos funcionários aparecerão aqui.'} />
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
