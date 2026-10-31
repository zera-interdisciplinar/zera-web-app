import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getUnitSettings, saveUnitSettings } from '../services/settings'

const key = ['settings', 'unit'] as const

export function useUnitSettings() {
  return useQuery({ queryKey: key, queryFn: ({ signal }) => getUnitSettings(signal) })
}

export function useSaveUnitSettings() {
  const client = useQueryClient()
  return useMutation({ mutationFn: saveUnitSettings, onSuccess: (saved) => client.setQueryData(key, saved) })
}
