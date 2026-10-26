import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { catalogApi, itemsApi, type ListItemsParams } from '../api/itemsApi'

export const itemKeys = {
  all: ['items'] as const,
  list: (params: ListItemsParams) => ['items', 'list', params] as const,
  detail: (id: string) => ['items', 'detail', id] as const,
  events: (id: string, page: number) => ['items', 'events', id, page] as const,
}
export const catalogKeys = { categories: ['catalog', 'categories'] as const, materials: ['catalog', 'materials'] as const, models: ['catalog', 'models'] as const }

export const MODEL_SELECT_SIZE = 100

/** Server-side pagination: the previous page stays on screen while the next one loads (BR-15). */
export function useItemsList(params: ListItemsParams) {
  return useQuery({ queryKey: itemKeys.list(params), queryFn: ({ signal }) => itemsApi.list(params, signal), placeholderData: keepPreviousData })
}

export function useItem(id: string) {
  return useQuery({ queryKey: itemKeys.detail(id), queryFn: ({ signal }) => itemsApi.get(id, signal), enabled: id !== '' })
}

export function useItemEvents(id: string, page: number, enabled: boolean) {
  return useQuery({ queryKey: itemKeys.events(id, page), queryFn: ({ signal }) => itemsApi.events(id, page, 20, signal), enabled, placeholderData: keepPreviousData })
}

export function useCategories() {
  return useQuery({ queryKey: catalogKeys.categories, queryFn: ({ signal }) => catalogApi.categories(signal), staleTime: 5 * 60_000 })
}
export function useMaterials() {
  return useQuery({ queryKey: catalogKeys.materials, queryFn: ({ signal }) => catalogApi.materials(signal), staleTime: 30 * 60_000 })
}
export function useModelOptions(enabled = true) {
  return useQuery({ queryKey: catalogKeys.models, queryFn: ({ signal }) => catalogApi.models(MODEL_SELECT_SIZE, signal), staleTime: 60_000, enabled })
}
