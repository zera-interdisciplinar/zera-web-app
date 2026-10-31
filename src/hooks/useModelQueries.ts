import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listModels } from '../services/models'
import type { ListModelsParams } from '../types/model'

export const modelKeys = {
  all: ['models'] as const,
  list: (params: ListModelsParams) => ['models', 'list', params] as const,
}

export function useModelsList(params: ListModelsParams) {
  return useQuery({ queryKey: modelKeys.list(params), queryFn: ({ signal }) => listModels(params, signal), placeholderData: keepPreviousData })
}
