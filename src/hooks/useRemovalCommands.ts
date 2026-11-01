import { useItemAction } from './useItemMutations'
import { useCategoryActions, useModelActions } from './useModelMutations'

/** Keep mutation orchestration and success messages out of the rendering layer. */
export function useCategoryRemoval(done: (message: string) => void) {
  const { remove } = useCategoryActions()
  return { remove, confirmRemoval: (id: string) => remove.mutate(id, { onSuccess: () => done('Categoria excluída.') }) }
}
export function useModelRemoval(done: (message: string) => void) {
  const { remove } = useModelActions()
  return { remove, confirmRemoval: (id: string) => remove.mutate(id, { onSuccess: () => done('Modelo excluído.') }) }
}
export function useItemRemoval(id: string, done: (message: string) => void) {
  const { remove } = useItemAction()
  return { remove, confirmRemoval: () => remove.mutate(id, { onSuccess: () => done('Item removido.') }) }
}
