import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from '../api/settingsApi'

const key = ['settings', 'unit'] as const

export function useUnitSettings() {
  return useQuery({ queryKey: key, queryFn: ({ signal }) => settingsApi.get(signal) })
}

export function useSaveUnitSettings() {
  const client = useQueryClient()
  return useMutation({ mutationFn: settingsApi.save, onSuccess: (saved) => client.setQueryData(key, saved) })
}
