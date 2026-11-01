import type { ProviderProps } from '../types/componentes/Provider'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '../utils/queryClient'

export function AppProviders({ children }: ProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
