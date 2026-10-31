import type { SseClient, StreamHandlers } from '../types/http'
import { toApiError } from '../utils/apiError'
import { sse } from './http'

const OVERVIEW_PATH = '/api/v1/dashboard/overview'

/**
 * Opens the analytics stream (BR-05, BR-06). It resolves when the stream ends for good; abort the signal to stop
 * it. The client is a parameter so tests can plug a fake one.
 */
export async function openOverviewStream(
  query: Record<string, string | undefined>,
  signal: AbortSignal,
  handlers: StreamHandlers,
  client: SseClient = sse,
): Promise<void> {
  try {
    await client.connect('analytics', OVERVIEW_PATH, { query, signal, handlers })
  } catch (error) {
    throw toApiError(error)
  }
}
