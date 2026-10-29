import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError, describeApiError } from '../../../shared/api/errors'
import { catalogKeys } from '../../items/hooks/queries'
import { categoriesApi, modelsApi } from '../api/modelsApi'
import type { ModelPatch } from '../model/requests'
import { modelKeys } from './queries'

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
      case 'name': return modelsApi.rename(id, patch.value)
      case 'manufacturer': return modelsApi.setManufacturer(id, patch.value)
      case 'warrantyMonths': return modelsApi.setWarranty(id, patch.value)
      case 'expectedLifespanMonths': return modelsApi.setLifespan(id, patch.value)
      case 'materials': return modelsApi.setMaterials(id, patch.value)
    }
  }
  return {
    create: useMutation({ mutationFn: modelsApi.create, onSettled: refresh }),
    /** One PATCH per changed field, in order; stops at the first failure so the form can show what is left. */
    edit: useMutation({
      mutationFn: async ({ id, patches }: { id: string; patches: ModelPatch[] }) => { for (const patch of patches) await apply(id, patch) },
      onSettled: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => modelsApi.remove(id), onSettled: refresh }),
  }
}

export function useCategoryActions() {
  const refresh = useRefreshCatalog()
  return {
    create: useMutation({ mutationFn: categoriesApi.create, onSettled: refresh }),
    edit: useMutation({
      mutationFn: async ({ id, name, description }: { id: string; name?: string; description?: string }) => {
        if (name !== undefined) await categoriesApi.rename(id, name)
        if (description !== undefined) await categoriesApi.setDescription(id, description)
      },
      onSettled: refresh,
    }),
    remove: useMutation({ mutationFn: (id: string) => categoriesApi.remove(id), onSettled: refresh }),
  }
}

/** 409 on delete means something still points at it (BR-16, BR-17). */
export function deleteFailureMessage(error: unknown, inUse: string): string {
  return error instanceof ApiError && error.status === 409 ? inUse : describeApiError(error)
}
