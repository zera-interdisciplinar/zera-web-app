import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../../../shared/api/errors'
import { itemsApi } from '../api/itemsApi'
import type { CreateItemRequest, UpdateItemRequest } from '../model/requests'
import type { ItemResponse } from '../schemas/item'
import { catalogKeys, itemKeys } from './queries'

export interface CreateItemResult {
  item: ItemResponse
  /** False when the item was saved but is still a draft because the submit asked for more data (HTTP 422). */
  submitted: boolean
  missingFields: string[]
}

/**
 * A 409 means somebody else changed the item since it was read: reload instead of repeating the call (BR-14).
 * The invalidation is done here so every mutation behaves the same way.
 */
function useRefreshOnConflict() {
  const client = useQueryClient()
  return (error: unknown) => {
    if (error instanceof ApiError && error.status === 409) void client.invalidateQueries({ queryKey: itemKeys.all })
  }
}

/** Create, then submit: a manager's item goes straight to stock, and the new model is approved with it (BR-10). */
export async function createAndSubmit(request: CreateItemRequest): Promise<CreateItemResult> {
  const created = await itemsApi.create(request)
  try {
    return { item: await itemsApi.submit(created.id), submitted: true, missingFields: [] }
  } catch (error) {
    // 422: the item exists but lacks data; it stays a draft and the form asks for what is missing.
    if (error instanceof ApiError && error.status === 422) return { item: created, submitted: false, missingFields: error.missingFields }
    throw error
  }
}

export function useCreateItem() {
  const client = useQueryClient()
  const onError = useRefreshOnConflict()
  return useMutation({
    mutationFn: createAndSubmit,
    onError,
    onSettled: () => Promise.all([client.invalidateQueries({ queryKey: itemKeys.all }), client.invalidateQueries({ queryKey: catalogKeys.models })]),
  })
}

export function useItemAction() {
  const client = useQueryClient()
  const onError = useRefreshOnConflict()
  const settle = () => client.invalidateQueries({ queryKey: itemKeys.all })
  return {
    update: useMutation({ mutationFn: ({ id, body }: { id: string; body: UpdateItemRequest }) => itemsApi.update(id, body), onError, onSettled: settle }),
    submit: useMutation({ mutationFn: (id: string) => itemsApi.submit(id), onError, onSettled: settle }),
    remove: useMutation({ mutationFn: (id: string) => itemsApi.remove(id), onError, onSettled: settle }),
    restore: useMutation({ mutationFn: (id: string) => itemsApi.restore(id), onError, onSettled: settle }),
    approve: useMutation({ mutationFn: (id: string) => itemsApi.approve(id), onError, onSettled: settle }),
    reject: useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => itemsApi.reject(id, reason), onError, onSettled: settle }),
  }
}
