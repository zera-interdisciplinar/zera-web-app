import { List, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button } from '../../../components/Button'
import type { Coluna } from '../../../components/DataTable'
import { DataTable } from '../../../components/DataTable'
import { EmptyState } from '../../../components/EmptyState'
import { EstadoErro } from '../../../components/EstadoErro'
import { Skeleton } from '../../../components/Skeleton'
import { Toast } from '../../../components/Toast'
import { useToast } from '../../../hooks/useToast'
import { describeApiError } from '../../../shared/api/errors'
import { NOT_AVAILABLE } from '../../../shared/format'
import { Pagination } from '../../../shared/ui/Pagination'
import { MATERIAL_LABEL } from '../../items/model/labels'
import { APPROVAL_STATUSES, type Model } from '../../items/schemas/item'
import { deleteFailureMessage, useModelActions } from '../hooks/mutations'
import { useModelsList } from '../hooks/queries'
import { APPROVAL_LABEL, type ApprovalStatus } from '../model/labels'
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog'
import { ModelDialog } from './ModelDialog'
import { ModelItemsDialog } from './ModelItemsDialog'
import styles from './Models.module.css'

type Target = { kind: 'create' } | { kind: 'edit' | 'delete' | 'items'; model: Model } | null

const SIZE = 20

function parseApproval(value: string | null): ApprovalStatus | undefined {
  return (APPROVAL_STATUSES as readonly string[]).includes(value ?? '') ? (value as ApprovalStatus) : undefined
}

/** Approval is read-only: the API has no endpoint to approve a model, it is approved together with its first item (BR-17). */
export function ModelsTab() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(0, Number(params.get('page')) || 0)
  const approvalStatus = parseApproval(params.get('approval'))
  const list = useModelsList({ page, size: SIZE, approvalStatus })
  const [target, setTarget] = useState<Target>(null)
  const [toast, notify] = useToast()
  const { remove } = useModelActions()
  const resetRemove = remove.reset

  const update = (next: { page?: number; approval?: string }) => {
    const copy = new URLSearchParams(params)
    if (next.page !== undefined) { if (next.page > 0) copy.set('page', String(next.page)); else copy.delete('page') }
    if (next.approval !== undefined) { copy.delete('page'); if (next.approval) copy.set('approval', next.approval); else copy.delete('approval') }
    setParams(copy, { replace: true })
  }

  // The columns do not depend on any state.
  const columns = useMemo<Coluna<Model>[]>(() => [
    { titulo: 'Modelo', render: (model) => model.name },
    { titulo: 'Fabricante', render: (model) => model.manufacturer },
    { titulo: 'Categoria', render: (model) => model.category.name },
    { titulo: 'Materiais', render: (model) => model.materials.map((material) => MATERIAL_LABEL[material.code]).join(', ') || NOT_AVAILABLE },
    { titulo: 'Vida útil', numerica: true, render: (model) => (model.expectedLifespanMonths ? `${model.expectedLifespanMonths} meses` : NOT_AVAILABLE) },
    { titulo: 'Garantia', numerica: true, render: (model) => (model.warrantyMonths ? `${model.warrantyMonths} meses` : NOT_AVAILABLE) },
    { titulo: 'Peso', numerica: true, render: (model) => (model.estimatedWeightKg ? `${model.estimatedWeightKg} kg` : NOT_AVAILABLE) },
    { titulo: 'Aprovação', render: (model) => <span className={`${styles.pill} ${styles[`approval_${model.approvalStatus}`]}`}>{APPROVAL_LABEL[model.approvalStatus]}</span> },
    { titulo: 'Ação', render: (model) => (
      <div className={styles.rowActions}>
        <button type="button" className={styles.rowAction} aria-label={`Itens do modelo ${model.name}`} title="Itens" onClick={() => setTarget({ kind: 'items', model })}><List aria-hidden="true" /></button>
        <button type="button" className={styles.rowAction} aria-label={`Editar ${model.name}`} title="Editar" onClick={() => setTarget({ kind: 'edit', model })}><Pencil aria-hidden="true" /></button>
        <button type="button" className={`${styles.rowAction} ${styles.danger}`} aria-label={`Excluir ${model.name}`} title="Excluir" onClick={() => { resetRemove(); setTarget({ kind: 'delete', model }) }}><Trash2 aria-hidden="true" /></button>
      </div>
    ) },
  ], [resetRemove])

  const close = () => setTarget(null)
  const done = (message: string) => { notify(message); close() }
  const data = list.data

  return (
    <div>
      <div className={styles.panelTop}>
        <label className={styles.field}>Aprovação
          <select value={approvalStatus ?? ''} onChange={(event) => update({ approval: event.target.value })}>
            <option value="">Todas</option>
            {APPROVAL_STATUSES.map((status) => <option key={status} value={status}>{APPROVAL_LABEL[status]}</option>)}
          </select>
        </label>
        <Button onClick={() => setTarget({ kind: 'create' })}><Plus aria-hidden="true" size={18} /> Novo modelo</Button>
      </div>

      {list.isPending && <Skeleton descricao="Carregando modelos…" linhas={5} />}
      {list.isError && !data && <EstadoErro mensagem={describeApiError(list.error)} aoTentarNovamente={() => void list.refetch()} />}
      {data && data.content.length === 0 && (
        <EmptyState titulo={approvalStatus ? 'Nenhum modelo com este filtro' : 'Nenhum modelo cadastrado'} descricao={approvalStatus ? 'Escolha outra situação de aprovação.' : 'Use “Novo modelo” para cadastrar o primeiro.'} />
      )}
      {data && data.content.length > 0 && (
        <>
          <DataTable legenda="Todos os modelos" colunas={columns} dados={data.content} chave={(model) => model.id} />
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} size={SIZE} sizes={[SIZE]} onPage={(next) => update({ page: next })} onSize={() => undefined} />
        </>
      )}

      {target?.kind === 'create' && <ModelDialog onClose={close} onDone={done} />}
      {target?.kind === 'edit' && <ModelDialog key={target.model.id} model={target.model} onClose={close} onDone={done} />}
      {target?.kind === 'items' && <ModelItemsDialog model={target.model} onClose={close} />}
      {target?.kind === 'delete' && (
        <ConfirmDeleteDialog title="Excluir modelo" message={`Excluir o modelo ${target.model.name}? Esta ação não pode ser desfeita.`} pending={remove.isPending}
          error={remove.isError ? deleteFailureMessage(remove.error, 'Há itens vinculados a este modelo. Remova ou troque o modelo desses itens antes de excluir.') : undefined}
          onClose={close} onConfirm={() => remove.mutate(target.model.id, { onSuccess: () => done('Modelo excluído.') })} />
      )}
      <Toast mensagem={toast} />
    </div>
  )
}
