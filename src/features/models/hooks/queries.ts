import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { modelsApi, type ListModelsParams } from '../api/modelsApi'

export const modelKeys = {
  all: ['models'] as const,
  list: (params: ListModelsParams) => ['models', 'list', params] as const,
  items: (id: string, page: number) => ['models', 'items', id, page] as const,
}

export function useModelsList(params: ListModelsParams) {
  return useQuery({ queryKey: modelKeys.list(params), queryFn: ({ signal }) => modelsApi.list(params, signal), placeholderData: keepPreviousData })
}

export function useModelItems(id: string, page: number) {
  return useQuery({ queryKey: modelKeys.items(id, page), queryFn: ({ signal }) => modelsApi.items(id, page, 20, signal), placeholderData: keepPreviousData })
}
