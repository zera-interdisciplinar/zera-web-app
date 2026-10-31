import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError, describeApiError } from '../utils/apiError'
import { catalogKeys } from './useItemQueries'
import { createCategory, removeCategory, renameCategory, setCategoryDescription } from '../services/categories'
import { createModel, removeModel, renameModel, setModelLifespan, setModelManufacturer, setModelMaterials, setModelWarranty } from '../services/models'

import { modelKeys } from './useModelQueries'
import type { ModelPatch } from '../types/model'

/** Model and category changes affect the item forms' selectors as well. */
function useRefreshCatalog() {
  const client = useQueryClient()
  return () => Promise.all([
    client.invalidateQueries({ queryKey: modelKeys.all }),
    client.invalidateQueries({ queryKey: catalogKeys.models }),
    client.invalidateQueries({ queryKey: catalogKeys.categories }),
    client.invalidateQueries({ queryKey: ['items'] }),
  ])
}

export function useModelActions() {
  const refresh = useRefreshCatalog()
  const apply = (id: string, patch: ModelPatch) => {
    switch (patch.field) {
      case 'name': return renameModel(id, patch.value)
      case 'manufacturer': return setModelManufacturer(id, patch.value)
      case 'warrantyMonths': return setModelWarranty(id, patch.value)
      case 'expectedLifespanMonths': return setModelLifespan(id, patch.value)
      case 'materials': return setModelMaterials(id, patch.value)
    }
  }
  return {
    create: useMutation({ mutationFn: createModel, onSettled: refresh }),
    /** One PATCH per changed field, in order; stops at the first failure so the form can show what is left. */
    edit: useMutation({
      mutationFn: async ({ id, patches }: { id: string; patches: ModelPatch[] }) => { for (const patch of patches) await apply(id, patch) },
      onSettled: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => removeModel(id), onSettled: refresh }),
  }
}

export function useCategoryActions() {
  const refresh = useRefreshCatalog()
  return {
    create: useMutation({ mutationFn: createCategory, onSettled: refresh }),
    edit: useMutation({
      mutationFn: async ({ id, name, description }: { id: string; name?: string; description?: string }) => {
        if (name !== undefined) await renameCategory(id, name)
        if (description !== undefined) await setCategoryDescription(id, description)
      },
      onSettled: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => removeCategory(id), onSettled: refresh }),
  }
}

/** 409 on delete means something still points at it (BR-16, BR-17). */
export function deleteFailureMessage(error: unknown, inUse: string): string {
  return error instanceof ApiError && error.status === 409 ? inUse : describeApiError(error)
}
