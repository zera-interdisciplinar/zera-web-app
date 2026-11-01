import { useCategoryRemoval } from '../../hooks/useRemovalCommands'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '../Button'
import type { Coluna } from '../DataTable'
import { DataTable } from '../DataTable'
import { EmptyState } from '../EmptyState'
import { EstadoErro } from '../EstadoErro'
import { Skeleton } from '../Skeleton'
import { Toast } from '../Toast'
import { useToast } from '../../hooks/useToast'
import { describeApiError } from '../../utils/apiError'
import { NOT_AVAILABLE } from '../../utils/format'
import { useCategories } from '../../hooks/useItemQueries'
import type { z } from 'zod'
import type { categorySchema } from '../../utils/itemSchemas'
import { deleteFailureMessage } from '../../hooks/useModelMutations'
import { CategoryDialog } from '../CategoryDialog'
import { ConfirmDeleteDialog } from '../ConfirmDeleteDialog'
import styles from '../../../styles/components/Models/Models.module.css'

type Category = z.infer<typeof categorySchema>
type Target = { kind: 'create' } | { kind: 'edit' | 'delete'; category: Category } | null

export function CategoriesTab() {
  const list = useCategories()
  const [target, setTarget] = useState<Target>(null)
  const [toast, notify] = useToast()

  const close = () => setTarget(null)
  const done = (message: string) => { notify(message); close() }
  const { remove, confirmRemoval } = useCategoryRemoval(done)
  const resetRemove = remove.reset

  // The columns do not depend on any state.
  const columns = useMemo<Coluna<Category>[]>(() => [
    { titulo: 'Categoria', render: (category) => category.name },
    { titulo: 'Descrição', render: (category) => category.description || NOT_AVAILABLE },
    { titulo: 'Ação', render: (category) => (
      <div className={styles.rowActions}>
        <button type="button" className={styles.rowAction} aria-label={`Editar categoria ${category.name}`} title="Editar" onClick={() => setTarget({ kind: 'edit', category })}><Pencil aria-hidden="true" /></button>
        <button type="button" className={`${styles.rowAction} ${styles.danger}`} aria-label={`Excluir categoria ${category.name}`} title="Excluir" onClick={() => { resetRemove(); setTarget({ kind: 'delete', category }) }}><Trash2 aria-hidden="true" /></button>
      </div>
    ) },
  ], [resetRemove])


  return (
    <div>
      <div className={styles.panelTop}>
        <p className={styles.muted}>Agrupam os modelos. Uma categoria em uso por modelos não pode ser excluída.</p>
        <Button onClick={() => setTarget({ kind: 'create' })}><Plus aria-hidden="true" size={18} /> Nova categoria</Button>
      </div>

      {list.isPending && <Skeleton descricao="Carregando categorias…" linhas={4} />}
      {list.isError && !list.data && <EstadoErro mensagem={describeApiError(list.error)} aoTentarNovamente={() => void list.refetch()} />}
      {list.data && list.data.length === 0 && <EmptyState titulo="Nenhuma categoria" descricao="Crie uma categoria para poder cadastrar modelos." />}
      {list.data && list.data.length > 0 && <DataTable legenda="Todas as categorias" colunas={columns} dados={list.data} chave={(category) => category.id} />}

      {target?.kind === 'create' && <CategoryDialog onClose={close} onDone={done} />}
      {target?.kind === 'edit' && <CategoryDialog key={target.category.id} category={target.category} onClose={close} onDone={done} />}
      {target?.kind === 'delete' && (
        <ConfirmDeleteDialog title="Excluir categoria" message={`Excluir a categoria ${target.category.name}?`} pending={remove.isPending}
          error={remove.isError ? deleteFailureMessage(remove.error, 'Categoria em uso por modelos. Troque ou exclua esses modelos antes.') : undefined}
          onClose={close} onConfirm={() => confirmRemoval(target.category.id)} />
      )}
      <Toast mensagem={toast} />
    </div>
  )
}
