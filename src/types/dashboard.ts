import type { PERIODS, VIEWS } from '../utils/snapshotValidation'
import type { z } from 'zod'
import type { snapshotSchema } from '../utils/snapshotValidation'
import type { StreamState } from './http'
import type { ApiError } from '../utils/apiError'

export interface DashboardFilters {
  period: (typeof PERIODS)[number]
  view: (typeof VIEWS)[number]
  from?: string
  to?: string
  category?: string
  status?: string
  responsible?: string
  q?: string
}

export interface FiltersParseResult {
  filters: DashboardFilters
  /** Human-readable problems found in the URL; the invalid parts are dropped, never sent to the BFF. */
  problems: string[]
}

export type DashboardSnapshot = z.infer<typeof snapshotSchema>

export type OverviewStatus = 'connecting' | 'live' | 'reconnecting' | 'unavailable' | 'error'

export interface OverviewState {
  connection: StreamState
  snapshot: DashboardSnapshot | null
  unavailable: string | null
  error: ApiError | null
}

export type OverviewAction =
  | { type: 'reset' }
  | { type: 'connection'; state: StreamState }
  | { type: 'snapshot'; snapshot: DashboardSnapshot }
  | { type: 'unavailable'; detail: string }
  | { type: 'failed'; error: ApiError }

export interface DistributionRow {
  key: string
  label: string
  quantity: number
  percent: number | null
}

export type Tone = 'navy' | 'green' | 'amber'

export type MonthlyPoint = DashboardSnapshot['itens_por_mes'][number]
