import { z } from 'zod'
import { isoDate } from '../../../shared/api/schemas'
import { PERIODS, VIEWS } from '../schemas/snapshot'

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

const INVALID_PARAM: Record<string, string> = {
  period: 'O período da URL é inválido; usando os últimos 6 meses.',
  view: 'A visão da URL é inválida; mostrando todos os itens.',
  from: 'A data inicial da URL é inválida e foi ignorada.',
  to: 'A data final da URL é inválida e foi ignorada.',
  category: 'A categoria da URL é inválida e foi ignorada.',
  status: 'A situação da URL é inválida e foi ignorada.',
  responsible: 'O responsável da URL é inválido e foi ignorado.',
  q: 'A busca da URL é longa demais e foi ignorada.',
}

export const DEFAULT_FILTERS: DashboardFilters = { period: '6m', view: 'todos' }

const text = (max: number) => z.string().trim().min(1).max(max)

const schema = z.object({
  period: z.enum(PERIODS).default('6m'),
  view: z.enum(VIEWS).default('todos'),
  from: isoDate.optional(),
  to: isoDate.optional(),
  category: text(120).optional(),
  status: text(60).optional(),
  responsible: text(120).optional(),
  q: text(120).optional(),
})

export interface FiltersParseResult {
  filters: DashboardFilters
  /** Human-readable problems found in the URL; the invalid parts are dropped, never sent to the BFF. */
  problems: string[]
}

/** BR-07: `from` and `to` only go together, with `from <= to`; period and view come from closed lists. */
export function parseFilters(params: URLSearchParams): FiltersParseResult {
  const raw: Record<string, string | undefined> = {}
  const problems: string[] = []
  for (const key of Object.keys(schema.shape)) {
    const value = params.get(key)
    if (value === null || value === '') continue
    const check = schema.shape[key as keyof typeof schema.shape].safeParse(value)
    if (check.success) raw[key] = value
    else problems.push(INVALID_PARAM[key] ?? 'Um filtro da URL é inválido e foi ignorado.')
  }
  const parsed = schema.parse(raw)
  const filters: DashboardFilters = { period: parsed.period, view: parsed.view }
  for (const key of ['category', 'status', 'responsible', 'q'] as const) if (parsed[key]) filters[key] = parsed[key]
  if (parsed.from || parsed.to) {
    if (!parsed.from || !parsed.to) problems.push('Informe as duas datas do intervalo (de e até).')
    else if (parsed.from > parsed.to) problems.push('A data inicial não pode ser depois da final.')
    else { filters.from = parsed.from; filters.to = parsed.to }
  }
  return { filters, problems }
}

/** Query sent to the BFF. Filters are read when the stream opens, so every change opens a new one (BR-06). */
export function toQuery(filters: DashboardFilters): Record<string, string | undefined> {
  return {
    period: filters.period, view: filters.view, from: filters.from, to: filters.to,
    category: filters.category, status: filters.status, responsible: filters.responsible, q: filters.q,
  }
}

/** Stable identity of a set of filters: the stream restarts only when this changes. */
export function filtersKey(filters: DashboardFilters): string {
  return JSON.stringify(toQuery(filters))
}

export function toSearchParams(filters: DashboardFilters): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(toQuery(filters))) {
    if (value === undefined) continue
    if ((key === 'period' && value === DEFAULT_FILTERS.period) || (key === 'view' && value === DEFAULT_FILTERS.view)) continue
    params.set(key, value)
  }
  return params
}
