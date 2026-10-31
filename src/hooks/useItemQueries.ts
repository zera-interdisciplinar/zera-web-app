import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listCategories } from '../services/categories'
import { getItem, listItems } from '../services/items'
import { listMaterials } from '../services/materials'
import { listModels } from '../services/models'
import type { ListItemsParams } from '../types/item'

export const itemKeys = {
  all: ['items'] as const,
  list: (params: ListItemsParams) => ['items', 'list', params] as const,
  detail: (id: string) => ['items', 'detail', id] as const,
}
export const catalogKeys = { categories: ['catalog', 'categories'] as const, materials: ['catalog', 'materials'] as const, models: ['catalog', 'models'] as const }

export const MODEL_SELECT_SIZE = 100

/** Server-side pagination: the previous page stays on screen while the next one loads (BR-15). */
export function useItemsList(params: ListItemsParams) {
  return useQuery({ queryKey: itemKeys.list(params), queryFn: ({ signal }) => listItems(params, signal), placeholderData: keepPreviousData })
}

export function useItem(id: string) {
  return useQuery({ queryKey: itemKeys.detail(id), queryFn: ({ signal }) => getItem(id, signal), enabled: id !== '' })
}

export function useCategories() {
  return useQuery({ queryKey: catalogKeys.categories, queryFn: ({ signal }) => listCategories(signal), staleTime: 5 * 60_000 })
}
export function useMaterials() {
  return useQuery({ queryKey: catalogKeys.materials, queryFn: ({ signal }) => listMaterials(signal), staleTime: 30 * 60_000 })
}
export function useModelOptions(enabled = true) {
  return useQuery({ queryKey: catalogKeys.models, queryFn: ({ signal }) => listModels({ page: 0, size: MODEL_SELECT_SIZE }, signal), staleTime: 60_000, enabled })
}
