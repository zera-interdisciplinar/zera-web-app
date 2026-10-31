import { QueryClient } from '@tanstack/react-query'

/**
 * The HTTP client already retries idempotent reads, so the query layer does not retry again.
 * Reads stay fresh for 30 s; refetching on window focus is off to avoid surprise reloads.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  })
}

/** Shared instance, so the auth layer can clear cached data on logout (BR-20). */
export const queryClient = createQueryClient()
