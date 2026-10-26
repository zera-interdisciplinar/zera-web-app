import { ApiError, describeApiError } from '../../../shared/api/errors'
import type { ItemResponse } from '../schemas/item'
import { useItemAction } from './mutations'

export type Notify = (message: string) => void

function failureMessage(error: unknown): string {
  return error instanceof ApiError && error.status === 409 ? 'O item mudou desde a última leitura. Os dados foram atualizados.' : describeApiError(error)
}

/** Actions that need no extra input: one click, one call, one toast. Dialog actions are handled by the dialogs. */
export function useItemCommands(notify: Notify) {
  const actions = useItemAction()

  function run(mutation: { mutate: (id: string, options: { onSuccess: () => void; onError: (error: unknown) => void }) => void }, item: ItemResponse, done: string) {
    mutation.mutate(item.id, { onSuccess: () => notify(done), onError: (error) => notify(failureMessage(error)) })
  }

  return {
    approve: (item: ItemResponse) => run(actions.approve, item, 'Item aprovado e incluído no estoque.'),
    restore: (item: ItemResponse) => run(actions.restore, item, 'Item restaurado.'),
    submit: (item: ItemResponse) => run(actions.submit, item, 'Cadastro concluído: o item está no estoque.'),
    busy: actions.approve.isPending || actions.restore.isPending || actions.submit.isPending,
  }
}

export { failureMessage }
