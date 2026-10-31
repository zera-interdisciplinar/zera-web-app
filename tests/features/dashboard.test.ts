import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../../src/utils/apiError'
import { CircularityDonut } from '../../src/components/CircularityDonut'
import { Distribution } from '../../src/components/Distribution'
import { FilterSummary } from '../../src/components/FilterSummary'
import { KpiCard } from '../../src/components/KpiCard'
import { initialOverviewState, overviewReducer, overviewStatus } from '../../src/reducers/overviewReducer'
import { filtersKey, parseFilters, toQuery, toSearchParams } from '../../src/utils/dashboardFilters'
import { formatCount, formatImpact, formatMonth, formatPercent, formatRelativeTime, formatSignedPercent, formatSignedPoints } from '../../src/utils/dashboardFormat'
import { severityLabel, statusLabel } from '../../src/utils/dashboardLabels'
import { snapshotSchema } from '../../src/utils/snapshotValidation'
import { dashboardSnapshotMock } from '../fixtures/dashboardSnapshot'

const params = (query: string) => new URLSearchParams(query)
/** A loosely typed view of the snapshot, so a test can break it in ways the type forbids. */
type Mutable = { [key: string]: Mutable } & { [index: number]: Mutable } & Record<string, unknown>

describe('snapshot schema (BR-24, BR-08)', () => {
  it('accepts the synthetic fixture and keeps nulls as nulls', () => {
    expect(snapshotSchema.safeParse(dashboardSnapshotMock).success).toBe(true)
    const nulls = structuredClone(dashboardSnapshotMock)
    nulls.kpis.itens_cadastrados.change_percent = null
    nulls.kpis.taxa_reciclagem = { percent: null, change_points: null }
    nulls.circularidade.percent = null
    nulls.por_categoria[0].percentual = null
    const parsed = snapshotSchema.parse(nulls)
    expect(parsed.kpis.taxa_reciclagem).toEqual({ percent: null, change_points: null })
    expect(parsed.circularidade.percent).toBeNull()
    expect(parsed.por_categoria[0].percentual).toBeNull()
  })

  it.each([
    ['a missing KPI', (s: Mutable) => { delete s.kpis.impacto_recuperado }],
    ['a negative count', (s: Mutable) => { s.kpis.itens_cadastrados.value = -1 }],
    ['a fractional count', (s: Mutable) => { s.alertas.abertos = 1.5 }],
    ['a null where a number is required', (s: Mutable) => { s.kpis.itens_cadastrados.value = null }],
    ['a month outside YYYY-MM', (s: Mutable) => { s.itens_por_mes[0].mes = '2026-13' }],
    ['an unknown period', (s: Mutable) => { s.applied_filters.period = '90d' }],
    ['an invalid batch date', (s: Mutable) => { s.extracted_at = 'ontem' }],
    ['a missing organization', (s: Mutable) => { delete s.organization }],
  ])('rejects %s instead of rendering partial data', (_label, mutate) => {
    const broken = structuredClone(dashboardSnapshotMock) as unknown as Mutable
    mutate(broken)
    expect(snapshotSchema.safeParse(broken).success).toBe(false)
  })
})

describe('filters (BR-07)', () => {
  it('uses the defaults for an empty URL', () => {
    expect(parseFilters(params(''))).toEqual({ filters: { period: '6m', view: 'todos' }, problems: [] })
  })

  it('reads every supported filter', () => {
    const { filters, problems } = parseFilters(params('period=12m&view=pendentes&category=Tecnologia&status=ACTIVE&responsible=u1&q=%20notebook%20&from=2026-01-01&to=2026-03-31'))
    expect(problems).toEqual([])
    expect(filters).toEqual({ period: '12m', view: 'pendentes', category: 'Tecnologia', status: 'ACTIVE', responsible: 'u1', q: 'notebook', from: '2026-01-01', to: '2026-03-31' })
  })

  it.each([
    ['from without to', 'from=2026-01-01', 'duas datas'],
    ['to without from', 'to=2026-01-01', 'duas datas'],
    ['from after to', 'from=2026-05-01&to=2026-01-01', 'depois da final'],
  ])('drops an invalid range: %s', (_label, query, problem) => {
    const { filters, problems } = parseFilters(params(query))
    expect(filters.from).toBeUndefined()
    expect(filters.to).toBeUndefined()
    expect(problems.join(' ')).toContain(problem)
  })

  it.each(['period=90d', 'view=tudo', 'from=2026-02-30&to=2026-03-01', `q=${'x'.repeat(121)}`])('never forwards the invalid value in %s', (query) => {
    const { filters, problems } = parseFilters(params(query))
    expect(problems.length).toBeGreaterThan(0)
    expect(problems.join(' ')).not.toMatch(/: valor inválido/)
    expect(filters.period).toBe('6m')
    expect(filters.view).toBe('todos')
    expect(Object.keys(toQuery(filters)).filter((key) => toQuery(filters)[key] !== undefined).sort()).toEqual(['period', 'view'])
  })

  it('builds the BFF query without unit_id (the unit goes in the header) and a stable key', () => {
    const filters = parseFilters(params('category=Tecnologia')).filters
    expect(toQuery(filters)).toEqual({ period: '6m', view: 'todos', from: undefined, to: undefined, category: 'Tecnologia', status: undefined, responsible: undefined, q: undefined })
    expect(Object.keys(toQuery(filters))).not.toContain('unit_id')
    expect(filtersKey(filters)).toBe(filtersKey(parseFilters(params('category=Tecnologia')).filters))
    expect(filtersKey(filters)).not.toBe(filtersKey(parseFilters(params('category=Mobília')).filters))
  })

  it('writes defaults out of the URL and round-trips the rest', () => {
    expect(toSearchParams({ period: '6m', view: 'todos' }).toString()).toBe('')
    const filters = { period: '30d' as const, view: 'categoria' as const, q: 'mesa' }
    expect(parseFilters(toSearchParams(filters)).filters).toEqual(filters)
  })
})

describe('formatting (BR-08)', () => {
  it('prints a dash, never zero, when there is no way to compute', () => {
    expect(formatPercent(null)).toBe('—')
    expect(formatSignedPercent(null)).toBe('—')
    expect(formatSignedPoints(null)).toBe('—')
    expect(formatPercent(0)).toBe('0%')
    expect(formatPercent(68, 2, true)).toBe('68,00%')
    expect(formatPercent(66.666, 2, true)).toBe('66,67%')
    expect(formatPercent(null, 2, true)).toBe('—')
    expect(formatSignedPercent(0)).toBe('0%')
  })

  it('signs changes and uses pt-BR decimals', () => {
    expect(formatSignedPercent(12.4)).toBe('+12,4%')
    expect(formatSignedPercent(-2.15)).toBe('−2,2%')
    expect(formatSignedPoints(4.5)).toBe('+4,5 p.p.')
    expect(formatSignedPoints(4.5, 2, true)).toBe('+4,50 p.p.')
    expect(formatSignedPoints(-0.126, 2, true)).toBe('−0,13 p.p.')
    expect(formatCount(1230)).toBe('1.230')
  })

  it('shows tonnes from one tonne up and kilograms below it', () => {
    expect(formatImpact(3100, 3.1)).toEqual({ value: '3,1 t', detail: '3.100 kg' })
    expect(formatImpact(186.4, 0.186)).toEqual({ value: '186,4 kg', detail: '0,186 t' })
  })

  it('formats months and relative times', () => {
    expect(formatMonth('2026-10')).toBe('out/26')
    expect(formatRelativeTime('2026-10-12T15:00:00Z', Date.parse('2026-10-12T15:30:00Z'))).toContain('30 minutos')
    expect(formatRelativeTime('nope')).toBe('—')
  })

  it('keeps unknown status and severity codes visible', () => {
    expect(statusLabel('ACTIVE')).toBe('Em estoque')
    expect(statusLabel('NEW_STATE')).toBe('NEW_STATE')
    expect(severityLabel('HIGH')).toBe('Alta')
    expect(severityLabel('x')).toBe('x')
  })
})

describe('stream state', () => {
  const failure = new ApiError('x', { kind: 'http', status: 400 })

  it('derives the status shown by the badge', () => {
    expect(overviewStatus(initialOverviewState)).toBe('connecting')
    const withSnapshot = overviewReducer(initialOverviewState, { type: 'snapshot', snapshot: snapshotSchema.parse(dashboardSnapshotMock) })
    expect(overviewStatus(withSnapshot)).toBe('live')
    expect(overviewStatus(overviewReducer(withSnapshot, { type: 'connection', state: 'reconnecting' }))).toBe('reconnecting')
    expect(overviewStatus(overviewReducer(initialOverviewState, { type: 'connection', state: 'reconnecting' }))).toBe('connecting')
    const unavailable = overviewReducer(initialOverviewState, { type: 'unavailable', detail: 'snapshot not ready' })
    expect(overviewStatus(overviewReducer(unavailable, { type: 'connection', state: 'reconnecting' }))).toBe('unavailable')
    expect(overviewStatus(overviewReducer(withSnapshot, { type: 'failed', error: failure }))).toBe('error')
    expect(overviewStatus(overviewReducer(initialOverviewState, { type: 'unavailable', detail: 'snapshot not ready' }))).toBe('unavailable')
  })

  it('keeps the last snapshot while reconnecting and drops it for a new filter', () => {
    const snapshot = snapshotSchema.parse(dashboardSnapshotMock)
    const live = overviewReducer(initialOverviewState, { type: 'snapshot', snapshot })
    expect(overviewReducer(live, { type: 'connection', state: 'reconnecting' }).snapshot).toBe(snapshot)
    expect(overviewReducer(live, { type: 'reset' })).toEqual(initialOverviewState)
  })

  it('lets a new batch replace an unavailable or failed state', () => {
    const snapshot = snapshotSchema.parse(dashboardSnapshotMock)
    const unavailable = overviewReducer(initialOverviewState, { type: 'unavailable', detail: 'snapshot not ready' })
    expect(overviewReducer(unavailable, { type: 'snapshot', snapshot })).toMatchObject({ snapshot, unavailable: null, error: null })
    expect(overviewReducer(overviewReducer(initialOverviewState, { type: 'failed', error: failure }), { type: 'snapshot', snapshot }).error).toBeNull()
  })
})

describe('components', () => {
  const html = (element: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(createElement(MemoryRouter, null, element))

  it('renders a KPI without inventing values and without a "meta"', () => {
    const markup = html(createElement(KpiCard, { title: 'Taxa de reciclagem', value: formatPercent(null, 0), icon: null, iconTone: 'green', note: formatSignedPoints(null) }))
    expect(markup).toContain('Taxa de reciclagem')
    expect(markup).toContain('—')
    expect(markup).not.toMatch(/NaN|undefined|meta/i)
  })

  it('renders the circularity ring with the percentage and no goal (BR-22)', () => {
    const markup = html(createElement(CircularityDonut, { percent: 62.4 }))
    expect(markup).toContain('62,4%')
    expect(markup).toContain('aria-label="Circularidade: 62,4%"')
    expect(markup).not.toMatch(/meta/i)
  })

  it('explains a null circularity instead of drawing an empty ring', () => {
    const markup = html(createElement(CircularityDonut, { percent: null }))
    expect(markup).toContain('ainda não foi calculada')
    expect(markup).not.toContain('<svg')
  })

  it('writes the numbers of a distribution, so nothing depends on the bar', () => {
    const markup = html(createElement(Distribution, { title: 'Por categoria', emptyText: 'vazio', rows: [{ key: 'a', label: 'Tecnologia', quantity: 21, percent: 44.68 }, { key: 'b', label: 'Sem %', quantity: 3, percent: null }] }))
    expect(markup).toContain('Tecnologia')
    expect(markup).toContain('21')
    expect(markup).toContain('(44,7%)')
    expect(markup).not.toContain('(—)')
    expect(html(createElement(Distribution, { title: 'x', emptyText: 'Nada por aqui', rows: [] }))).toContain('Nada por aqui')
  })

  it('summarizes the applied filters in the top bar format', () => {
    const markup = html(createElement(FilterSummary, { filters: { period: '6m', view: 'todos', responsible: 'user-1', status: 'PENDING_APPROVAL' }, available: dashboardSnapshotMock.available_filters }))
    expect(markup).toContain('Período: últimos 6 meses')
    expect(markup).toContain('Categoria: todas')
    expect(markup).toContain('Situação: Em aprovação')
    expect(markup).toContain('Responsável: Ana Souza')
  })
})
