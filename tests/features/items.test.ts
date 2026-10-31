import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createHttpClient } from '../../src/services/httpClient'
import { ApiError } from '../../src/utils/apiError'

import { createItemSchema, editItemSchema, rejectSchema } from '../../src/utils/itemValidation'
import { eventSchema, itemPageSchema, itemSchema, ITEM_STATUSES, ITEM_CONDITIONS, DAMAGE_TYPES, MATERIAL_CODES, EVENT_TYPES } from '../../src/utils/itemSchemas'
import { toCreateRequest, toUpdateRequest } from '../../src/utils/itemRequests'
import { toEditInput, toEditValues } from '../../src/utils/itemEditValues'
import { ACTION_LABEL, availableActions } from '../../src/utils/itemActions'
import { DEFAULT_PAGE_SIZE, parseItemFilters, toItemSearchParams } from '../../src/utils/itemFilters'
import { toFormFailure } from '../../src/utils/itemFormErrors'
import { EVENT_LABEL, fieldLabel, STATUS_LABEL, STATUS_TONE } from '../../src/utils/itemLabels'
import { StatusPill } from '../../src/components/StatusPill'
import { ItemActionButtons } from '../../src/components/ItemActionButtons'
import { Pagination } from '../../src/components/Pagination'
import { TextField } from '../../src/components/TextField'
import { ChoiceGroup } from '../../src/components/ChoiceGroup'
import { ChoiceOption } from '../../src/components/ChoiceOption'
import { FilterSelect } from '../../src/components/FilterSelect'
import type { CreateItemInput, ItemResponse, ItemStatus } from '../../src/types/item'

// The application client is replaced by one backed by a fetch double, so the real API module runs end to end.
const holder = vi.hoisted(() => ({ client: undefined as unknown }))
vi.mock('../../src/services/http', () => ({ http: { request: (...args: unknown[]) => (holder.client as { request: (...a: unknown[]) => unknown }).request(...args) } }))

const { approveItem, getItem, listItemEvents, listItems, rejectItem, removeItem, restoreItem, updateItem } = await import('../../src/services/items')
const { listCategories } = await import('../../src/services/categories')
const { listMaterials } = await import('../../src/services/materials')
const { createAndSubmit } = await import('../../src/hooks/useItemMutations')

const contract = JSON.parse(readFileSync(new URL('../fixtures/openapi/inventory.json', import.meta.url), 'utf8').replace(/^\uFEFF/, '')) as {
  components: { schemas: Record<string, { required?: string[]; properties: Record<string, { enum?: string[]; items?: { enum?: string[] } }> }> }
}
const schemas = contract.components.schemas

const ISO = '2026-10-28T14:12:00Z'
const category = { id: 'cat-1', name: 'Eletrônicos', description: 'Aparelhos' }
const model = { id: 'model-1', name: 'ThinkPad T14', manufacturer: 'Lenovo', materials: [{ id: 'mat-1', code: 'METAL', name: 'Metal', recyclable: true, hazardous: false }], category, approvalStatus: 'APPROVED' }
const item = (over: Record<string, unknown> = {}): ItemResponse => itemSchema.parse({
  id: 'item-1', barcode: '789', displayCode: 'ZR-0001', name: 'Notebook', status: 'IN_STOCK', condition: 'USED', hasDamages: false, damages: [], unitId: 'unit-1',
  model, usageIntensity: 4, createdByName: 'Ana', createdAt: ISO, updatedAt: ISO, ...over,
})

const validCreate = (over: Partial<CreateItemInput> = {}): CreateItemInput => ({
  barcode: ' 789 ', modelMode: 'existing', modelId: 'model-1', name: ' Notebook ', condition: 'USED', hasDamages: 'no', damages: [], usageIntensity: '4',
  serialNumber: '', acquiredAt: '', manufacturingYear: '', notes: '', ...over,
})
const issuePaths = (input: unknown, schema: typeof createItemSchema | typeof editItemSchema = createItemSchema) => {
  const result = schema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('item response schema (BR-24)', () => {
  it('accepts optional fields omitted or null and keeps them as no value', () => {
    const minimal = itemSchema.parse({ id: 'a', barcode: 'b', status: 'DRAFT', unitId: 'u', createdAt: ISO, updatedAt: ISO })
    expect(minimal.name ?? null).toBeNull()
    const nulls = itemSchema.parse({ id: 'a', barcode: 'b', status: 'DRAFT', unitId: 'u', createdAt: ISO, updatedAt: ISO, name: null, model: null, usageIntensity: null, photoUrl: null })
    expect(nulls.model).toBeNull()
  })

  it.each([
    ['an unknown status', { status: 'ARCHIVED' }],
    ['an empty barcode', { barcode: '' }],
    ['a usage intensity above 10', { usageIntensity: 11 }],
    ['a malformed timestamp', { updatedAt: 'ontem' }],
    ['an unknown damage type', { damages: ['SCRATCH'] }],
  ])('rejects %s as a contract error', (_, over) => {
    expect(() => item(over)).toThrow()
  })

  it('checks the paged envelope', () => {
    const page = { content: [item()], page: 0, size: 20, totalElements: 1, totalPages: 1 }
    expect(itemPageSchema.safeParse(page).success).toBe(true)
    expect(itemPageSchema.safeParse({ ...page, totalElements: 0 }).success).toBe(false)
  })

  it('reads events with transitions and without them', () => {
    expect(eventSchema.safeParse({ id: 'e', itemId: 'i', type: 'APPROVED', fromStatus: 'PENDING_APPROVAL', toStatus: 'IN_STOCK', occurredAt: ISO }).success).toBe(true)
    expect(eventSchema.safeParse({ id: 'e', itemId: 'i', type: 'CREATED', occurredAt: ISO }).success).toBe(true)
    expect(eventSchema.safeParse({ id: 'e', itemId: 'i', type: 'TELEPORTED', occurredAt: ISO }).success).toBe(false)
  })
})

describe('contract parity with the QA OpenAPI (BR-11, BR-24)', () => {
  it('uses the same closed lists as ItemResponse and EventResponse', () => {
    expect([...ITEM_STATUSES]).toEqual(schemas.ItemResponse.properties.status.enum)
    expect([...ITEM_CONDITIONS]).toEqual(schemas.ItemResponse.properties.condition.enum)
    expect([...DAMAGE_TYPES]).toEqual(schemas.ItemResponse.properties.damages.items?.enum)
    expect([...MATERIAL_CODES]).toEqual(schemas.NewItemModelRequest.properties.materials.items?.enum)
    expect([...EVENT_TYPES]).toEqual(schemas.EventResponse.properties.type.enum)
  })

  it('has a label for every status and event type, and a tone for every status', () => {
    for (const status of ITEM_STATUSES) { expect(STATUS_LABEL[status]).toBeTruthy(); expect(STATUS_TONE[status]).toBeTruthy() }
    for (const type of EVENT_TYPES.filter((value) => value !== 'STATUS_CHANGED')) expect(EVENT_LABEL[type]).toBeTruthy()
  })

  it('builds request bodies only with fields the API declares', () => {
    const create = toCreateRequest(createItemSchema.parse(validCreate({ serialNumber: 'SN', acquiredAt: '2025-01-01', manufacturingYear: '2024', notes: 'ok', hasDamages: 'yes', damages: ['OXIDATION'] })), 'id-1')
    expect(Object.keys(create).filter((key) => !(key in schemas.CreateItemRequest.properties))).toEqual([])
    const withModel = toCreateRequest(createItemSchema.parse(validCreate({ modelMode: 'new', modelId: '', model: { name: 'X', manufacturer: 'Y', categoryId: 'cat-1', materials: ['METAL'], estimatedWeightKg: '1.5' } })), 'id-2')
    expect(Object.keys(withModel.model ?? {}).filter((key) => !(key in schemas.NewItemModelRequest.properties))).toEqual([])
    const update = toUpdateRequest({}, editItemSchema.parse({ name: 'N', condition: 'NEW', hasDamages: 'yes', damages: ['OTHER'], usageIntensity: '2', serialNumber: 'S', acquiredAt: '2025-01-01', manufacturingYear: '2020', notes: 'n' }))
    expect(Object.keys(update).filter((key) => !(key in schemas.UpdateItemRequest.properties))).toEqual([])
    for (const required of schemas.CreateItemRequest.required ?? []) expect(create).toHaveProperty(required)
    for (const required of schemas.NewItemModelRequest.required ?? []) expect(withModel.model).toHaveProperty(required)
  })
})

describe('create form validation (BR-11)', () => {
  it('accepts a complete form and normalizes it', () => {
    const values = createItemSchema.parse(validCreate())
    expect(values).toMatchObject({ barcode: '789', name: 'Notebook', usageIntensity: 4, serialNumber: undefined, notes: undefined })
  })

  it.each([
    ['an empty barcode', { barcode: '   ' }, 'barcode'],
    ['a name above 120 characters', { name: 'x'.repeat(121) }, 'name'],
    ['no condition', { condition: '' as never }, 'condition'],
    ['no answer about damages', { hasDamages: undefined as never }, 'hasDamages'],
    ['damages without a type', { hasDamages: 'yes', damages: [] }, 'damages'],
    ['no usage intensity', { usageIntensity: '' }, 'usageIntensity'],
    ['usage intensity 11', { usageIntensity: '11' }, 'usageIntensity'],
    ['a fractional usage intensity', { usageIntensity: '2.5' }, 'usageIntensity'],
    ['a serial number above 120 characters', { serialNumber: 's'.repeat(121) }, 'serialNumber'],
    ['notes above 500 characters', { notes: 'n'.repeat(501) }, 'notes'],
    ['a future acquisition date', { acquiredAt: '2999-01-01' }, 'acquiredAt'],
    ['a manufacturing year in the future', { manufacturingYear: String(new Date().getFullYear() + 1) }, 'manufacturingYear'],
    ['an existing model mode without a model', { modelId: '' }, 'modelId'],
  ])('rejects %s', (_, over, path) => {
    expect(issuePaths(validCreate(over as Partial<CreateItemInput>))).toContain(path)
  })

  it('demands the data of a new model, and only then', () => {
    const empty = validCreate({ modelMode: 'new', modelId: '', model: { name: '', manufacturer: '', categoryId: '', materials: [], estimatedWeightKg: '' } })
    expect(issuePaths(empty)).toEqual(expect.arrayContaining(['model.name', 'model.manufacturer', 'model.categoryId', 'model.materials']))
    expect(issuePaths(validCreate({ modelMode: 'new', modelId: '', model: { name: 'N', manufacturer: 'M', categoryId: 'c', materials: ['METAL'], estimatedWeightKg: '0' } }))).toContain('model.estimatedWeightKg')
    expect(issuePaths(validCreate({ modelMode: 'new', modelId: '', model: { name: 'N', manufacturer: 'M', categoryId: 'c', materials: ['METAL'], estimatedWeightKg: '' } }))).toEqual([])
    // An unfinished new-model block does not block a form that picked an existing model.
    expect(issuePaths(validCreate({ model: { name: '', manufacturer: '', categoryId: '', materials: [], estimatedWeightKg: '' } }))).toEqual([])
  })

  it('reports every problem in one pass, including the cross-field ones', () => {
    const paths = issuePaths(validCreate({ barcode: '', modelId: '', condition: '' as never, hasDamages: 'yes', damages: [], usageIntensity: '' }))
    expect(paths).toEqual(expect.arrayContaining(['barcode', 'modelId', 'condition', 'damages', 'usageIntensity']))
    const newModel = issuePaths(validCreate({ modelMode: 'new', modelId: '', hasDamages: '' as never, model: { name: '', manufacturer: '', categoryId: '', materials: [], estimatedWeightKg: '' } }))
    expect(newModel).toEqual(expect.arrayContaining(['hasDamages', 'model.name', 'model.manufacturer', 'model.categoryId', 'model.materials']))
  })

  it('treats empty optional inputs as not informed, never as zero', () => {
    const values = createItemSchema.parse(validCreate({ manufacturingYear: '', usageIntensity: '0' }))
    expect(values.manufacturingYear).toBeUndefined()
    expect(values.usageIntensity).toBe(0)
  })
})

describe('create request (BR-09, BR-10, BR-11)', () => {
  it('sends the client id, no unit and no status', () => {
    const body = toCreateRequest(createItemSchema.parse(validCreate()), 'uuid-1')
    expect(body).toEqual({ id: 'uuid-1', barcode: '789', name: 'Notebook', condition: 'USED', hasDamages: false, usageIntensity: 4, modelId: 'model-1' })
    expect(Object.keys(body)).not.toEqual(expect.arrayContaining(['unitId']))
    expect(body).not.toHaveProperty('status')
  })

  it('sends exactly one of modelId and model', () => {
    const existing = toCreateRequest(createItemSchema.parse(validCreate()), 'a')
    expect(existing.model).toBeUndefined()
    const created = toCreateRequest(createItemSchema.parse(validCreate({ modelMode: 'new', modelId: 'ignored', model: { name: 'N', manufacturer: 'M', categoryId: 'c', materials: ['METAL', 'GLASS'], estimatedWeightKg: '2' } })), 'b')
    expect(created.modelId).toBeUndefined()
    expect(created.model).toEqual({ name: 'N', manufacturer: 'M', categoryId: 'c', materials: ['METAL', 'GLASS'], estimatedWeightKg: 2 })
  })

  it('sends damages only when the item has them', () => {
    expect(toCreateRequest(createItemSchema.parse(validCreate({ hasDamages: 'yes', damages: ['OXIDATION'] })), 'a')).toMatchObject({ hasDamages: true, damages: ['OXIDATION'] })
    expect(toCreateRequest(createItemSchema.parse(validCreate({ hasDamages: 'no', damages: ['OXIDATION'] })), 'a')).not.toHaveProperty('damages')
  })
})

describe('edit request (BR-12)', () => {
  const current = item({ name: 'Notebook', condition: 'USED', hasDamages: false, damages: [], usageIntensity: 4, serialNumber: 'SN-1', notes: 'antigo' })
  const submit = (over: Record<string, unknown>) => editItemSchema.parse({ ...toEditInput(current), ...over })
  const diff = (over: Record<string, unknown>) => toUpdateRequest(toEditValues(current), submit(over))

  it('sends nothing when nothing changed', () => {
    expect(diff({})).toEqual({})
  })

  it('sends only the fields that changed', () => {
    expect(diff({ name: 'Notebook Pro' })).toEqual({ name: 'Notebook Pro' })
    expect(diff({ usageIntensity: '9', condition: 'DAMAGED' })).toEqual({ usageIntensity: 9, condition: 'DAMAGED' })
  })

  it('erases serial number and notes with an empty string, because absence means "keep"', () => {
    expect(diff({ serialNumber: '', notes: '' })).toEqual({ serialNumber: '', notes: '' })
  })

  it('sends hasDamages together with the list', () => {
    expect(diff({ hasDamages: 'yes', damages: ['BROKEN_SCREEN'] })).toEqual({ hasDamages: true, damages: ['BROKEN_SCREEN'] })
    const damaged = item({ hasDamages: true, damages: ['BROKEN_SCREEN', 'OXIDATION'] })
    const next = editItemSchema.parse({ ...toEditInput(damaged), hasDamages: 'no' })
    expect(toUpdateRequest(toEditValues(damaged), next)).toEqual({ hasDamages: false, damages: [] })
    expect(toUpdateRequest(toEditValues(damaged), editItemSchema.parse({ ...toEditInput(damaged), damages: ['OXIDATION', 'BROKEN_SCREEN'] }))).toEqual({})
  })

  it('fills a draft that had no data', () => {
    const draft = item({ status: 'DRAFT', condition: null, hasDamages: null, usageIntensity: null, name: null })
    expect(toEditInput(draft)).toMatchObject({ name: '', condition: '', usageIntensity: '' })
    const body = toUpdateRequest(toEditValues(draft), editItemSchema.parse({ ...toEditInput(draft), name: 'N', condition: 'NEW', hasDamages: 'no', usageIntensity: '1' }))
    expect(body).toMatchObject({ name: 'N', condition: 'NEW', usageIntensity: 1, hasDamages: false })
  })
})

describe('reject form (BR-14)', () => {
  it('requires a reason of 1 to 500 characters', () => {
    expect(rejectSchema.safeParse({ reason: '   ' }).success).toBe(false)
    expect(rejectSchema.safeParse({ reason: 'x'.repeat(501) }).success).toBe(false)
    expect(rejectSchema.parse({ reason: '  Foto ilegível ' }).reason).toBe('Foto ilegível')
  })
})

describe('available actions (BR-13, BR-14)', () => {
  const actionsOf = (status: ItemStatus) => availableActions({ status })

  it.each<[ItemStatus, string[]]>([
    ['DRAFT', ['edit', 'submit', 'remove']],
    ['PENDING_APPROVAL', ['edit', 'approve', 'reject', 'remove']],
    ['REJECTED', ['edit', 'submit', 'remove']],
    ['IN_STOCK', ['edit', 'remove']],
    ['IN_USE', ['edit', 'remove']],
    ['IN_MAINTENANCE', ['edit', 'remove']],
    ['AWAITING_EVALUATION', ['edit', 'remove']],
    ['DISPOSED', []],
    ['REMOVED', ['restore']],
  ])('%s offers %j', (status, expected) => {
    expect(actionsOf(status)).toEqual(expected)
  })

  it('only offers approve and reject while the item waits for approval', () => {
    for (const status of ITEM_STATUSES.filter((value) => value !== 'PENDING_APPROVAL')) expect(actionsOf(status)).not.toEqual(expect.arrayContaining(['approve']))
  })

  it('never offers removal for a disposed item and always names the action', () => {
    expect(actionsOf('DISPOSED')).not.toContain('remove')
    for (const status of ITEM_STATUSES) for (const action of actionsOf(status)) expect(ACTION_LABEL[action]).toBeTruthy()
  })
})

describe('list filters in the URL (BR-15)', () => {
  it('starts at the first page with the default size', () => {
    expect(parseItemFilters(new URLSearchParams(''))).toEqual({ page: 0, size: DEFAULT_PAGE_SIZE })
  })

  it('round-trips valid filters', () => {
    const filters = { page: 2, size: 50, q: 'notebook', status: 'PENDING_APPROVAL' as const, categoryId: 'cat-1', modelId: 'model-1' }
    expect(parseItemFilters(toItemSearchParams(filters))).toEqual(filters)
    expect(toItemSearchParams({ page: 0, size: DEFAULT_PAGE_SIZE }).toString()).toBe('')
  })

  it('ignores values the API would refuse', () => {
    expect(parseItemFilters(new URLSearchParams('status=ARCHIVED&page=-1&size=500&q=%20%20'))).toEqual({ page: 0, size: DEFAULT_PAGE_SIZE })
    expect(parseItemFilters(new URLSearchParams('page=abc&size=1.5'))).toEqual({ page: 0, size: DEFAULT_PAGE_SIZE })
    expect(parseItemFilters(new URLSearchParams(`q=${'a'.repeat(100)}`)).q).toHaveLength(60)
  })
})

describe('form failures', () => {
  const http = (status: number, init: Partial<ConstructorParameters<typeof ApiError>[1]> = {}) => new ApiError('x', { kind: 'http', status, ...init })

  it('maps a duplicate barcode on create to the barcode field', () => {
    expect(toFormFailure(http(409), 'create')).toEqual({ fields: { barcode: 'Já existe um item com este código de barras.' } })
  })
  it('tells the manager the item changed on edit', () => {
    expect(toFormFailure(http(409), 'edit').general).toMatch(/mudou/)
  })
  it('ties 400 field errors to fields and never repeats the server wording', () => {
    const failure = toFormFailure(http(400, { fieldErrors: { name: 'must not be blank', 'model.name': 'size must be between 1 and 120', secret: 'x' } }), 'create')
    expect(failure.fields).toEqual({ name: 'Valor inválido. Revise este campo.', 'model.name': 'Valor inválido. Revise este campo.' })
    expect(JSON.stringify(failure)).not.toMatch(/blank|between/)
  })
  it('lists the missing fields of a 422', () => {
    expect(toFormFailure(http(422, { missingFields: ['usageIntensity', 'condition'] }), 'edit').general).toBe('Faltam dados para concluir o cadastro: Intensidade de uso, Condição.')
    expect(fieldLabel('somethingNew')).toBe('somethingNew')
  })
  it('falls back to a generic message', () => {
    expect(toFormFailure(new ApiError('boom', { kind: 'network' }), 'create').general).toMatch(/servidor/)
    expect(toFormFailure(new Error('x'), 'edit').general).toBeTruthy()
  })
})

describe('items API against a fetch double (BR-09, BR-10, BR-15)', () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  const call = (index: number) => ({ url: (fetchMock.mock.calls[index][0] as URL).pathname + (fetchMock.mock.calls[index][0] as URL).search, init: fetchMock.mock.calls[index][1] as RequestInit })

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>()
    holder.client = createHttpClient({
      baseUrls: { administrative: '/api/administrative', inventory: '/api/inventory', analytics: '/api/analytics' },
      session: { getAccessToken: () => 'token', getUnitId: () => 'unit-1', refresh: async () => false, onExpired: () => undefined },
      fetchImpl: fetchMock, sleep: async () => undefined, origin: 'https://app.example.invalid',
    })
  })

  it('lists with server-side pagination and filters, skipping empty ones', async () => {
    fetchMock.mockResolvedValue(json({ content: [item()], page: 1, size: 50, totalElements: 51, totalPages: 2 }))
    const page = await listItems({ page: 1, size: 50, q: 'note', status: 'IN_STOCK', categoryId: undefined })
    expect(page.totalElements).toBe(51)
    expect(call(0).url).toBe('/api/inventory/api/v1/items?page=1&size=50&q=note&status=IN_STOCK')
    expect((call(0).init.headers as Record<string, string>)['X-Unit-Id']).toBe('unit-1')
  })

  it('fails with a contract error when the list does not match the schema', async () => {
    fetchMock.mockResolvedValue(json({ content: [{ id: 'x' }], page: 0, size: 20, totalElements: 1, totalPages: 1 }))
    await expect(listItems({ page: 0, size: 20 })).rejects.toMatchObject({ kind: 'contract' })
  })

  it('encodes the id in the path', async () => {
    fetchMock.mockResolvedValue(json(item()))
    await getItem('a/b c')
    expect(call(0).url).toBe('/api/inventory/api/v1/items/a%2Fb%20c')
  })

  it('creates, then submits, and never puts the unit in the body', async () => {
    const request = toCreateRequest(createItemSchema.parse(validCreate()), 'uuid-1')
    fetchMock.mockResolvedValueOnce(json(item({ id: 'uuid-1', status: 'DRAFT' }), 201)).mockResolvedValueOnce(json(item({ id: 'uuid-1', status: 'IN_STOCK' })))
    const result = await createAndSubmit(request)
    expect(result).toMatchObject({ submitted: true, missingFields: [], item: { status: 'IN_STOCK' } })
    expect(call(0)).toMatchObject({ url: '/api/inventory/api/v1/items', init: { method: 'POST' } })
    expect(call(1)).toMatchObject({ url: '/api/inventory/api/v1/items/uuid-1/submit', init: { method: 'POST' } })
    expect(JSON.parse(call(0).init.body as string)).not.toHaveProperty('unitId')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('keeps the draft and returns the missing fields when the submit answers 422', async () => {
    fetchMock.mockResolvedValueOnce(json(item({ id: 'uuid-1', status: 'DRAFT' }), 201))
      .mockResolvedValueOnce(json({ status: 422, title: 'Unprocessable', detail: 'missing', missingFields: ['usageIntensity'] }, 422))
    const result = await createAndSubmit(toCreateRequest(createItemSchema.parse(validCreate()), 'uuid-1'))
    expect(result).toMatchObject({ submitted: false, missingFields: ['usageIntensity'], item: { id: 'uuid-1', status: 'DRAFT' } })
  })

  it('does not submit when the create fails, and surfaces a duplicate barcode as 409', async () => {
    fetchMock.mockResolvedValueOnce(json({ status: 409, title: 'Conflict' }, 409))
    await expect(createAndSubmit(toCreateRequest(createItemSchema.parse(validCreate()), 'uuid-1'))).rejects.toMatchObject({ status: 409 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not hide other submit failures', async () => {
    fetchMock.mockResolvedValueOnce(json(item({ status: 'DRAFT' }), 201)).mockResolvedValueOnce(json({ status: 409, title: 'Conflict' }, 409))
    await expect(createAndSubmit(toCreateRequest(createItemSchema.parse(validCreate()), 'uuid-1'))).rejects.toMatchObject({ status: 409 })
  })

  it.each([
    ['update', () => updateItem('i', { name: 'N' }), 'PATCH', '/api/inventory/api/v1/items/i', { name: 'N' }],
    ['remove', () => removeItem('i'), 'DELETE', '/api/inventory/api/v1/items/i', undefined],
    ['restore', () => restoreItem('i'), 'POST', '/api/inventory/api/v1/items/i/restore', undefined],
    ['approve', () => approveItem('i'), 'POST', '/api/inventory/api/v1/items/i/approve', undefined],
    ['reject', () => rejectItem('i', 'Sem foto'), 'POST', '/api/inventory/api/v1/items/i/reject', { reason: 'Sem foto' }],
  ])('%s calls the right endpoint', async (_, run, method, url, body) => {
    fetchMock.mockImplementation(async () => (method === 'DELETE' ? new Response(null, { status: 204 }) : json(item())))
    await run()
    expect(call(0)).toMatchObject({ url, init: { method } })
    expect(call(0).init.body === undefined ? undefined : JSON.parse(call(0).init.body as string)).toEqual(body)
  })

  it('reads events and catalogs, with the unit only where the API wants it', async () => {
    fetchMock.mockResolvedValueOnce(json({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }))
      .mockResolvedValueOnce(json([category]))
      .mockResolvedValueOnce(json([model.materials[0]]))
    await listItemEvents('i', 0, 20)
    await listCategories()
    await listMaterials()
    expect(call(0).url).toBe('/api/inventory/api/v1/items/i/events?page=0&size=20')
    expect((call(1).init.headers as Record<string, string>)['X-Unit-Id']).toBe('unit-1')
    expect((call(2).init.headers as Record<string, string>)['X-Unit-Id']).toBeUndefined()
  })
})

describe('presentation', () => {
  it('writes the status out, so color is never the only signal', () => {
    for (const status of ITEM_STATUSES) expect(renderToStaticMarkup(createElement(StatusPill, { status }))).toContain(STATUS_LABEL[status])
  })

  it('names each row action after the item', () => {
    const html = renderToStaticMarkup(createElement(ItemActionButtons, { item: item({ status: 'PENDING_APPROVAL' }), onAction: () => undefined, compact: true }))
    for (const label of ['Editar Notebook', 'Aprovar Notebook', 'Reprovar Notebook', 'Remover Notebook']) expect(html).toContain(`aria-label="${label}"`)
    expect(html).not.toContain('Restaurar')
  })

  it('disables the actions while one is running', () => {
    expect(renderToStaticMarkup(createElement(ItemActionButtons, { item: item(), onAction: () => undefined, disabled: true }))).toContain('disabled=""')
  })

  it('paginates from zero and disables the ends', () => {
    const first = renderToStaticMarkup(createElement(Pagination, { page: 0, totalPages: 3, totalElements: 41, size: 20, onPage: () => undefined, onSize: () => undefined }))
    expect(first).toContain('41 resultados · página 1 de 3')
    expect(first).toMatch(/<button[^>]*disabled=""[^>]*>Anterior/)
    expect(first).not.toMatch(/<button[^>]*disabled=""[^>]*>Próxima/)
    const last = renderToStaticMarkup(createElement(Pagination, { page: 2, totalPages: 3, totalElements: 41, size: 20, onPage: () => undefined, onSize: () => undefined, sizes: [20] }))
    expect(last).toMatch(/<button[^>]*disabled=""[^>]*>Próxima/)
    expect(last).not.toContain('Por página')
  })

  it('links the error to the field and flags it invalid', () => {
    const html = renderToStaticMarkup(createElement(TextField, { label: 'Nome', required: true, error: 'Informe o nome.', id: 'name' }))
    expect(html).toContain('aria-invalid="true"')
    expect(html).toContain('aria-describedby="name-error"')
    expect(html).toContain('id="name-error" role="alert"')
    expect(renderToStaticMarkup(createElement(TextField, { label: 'Nome', id: 'ok' }))).not.toContain('aria-invalid')
  })

  it('ties every option and filter to its label with htmlFor', () => {
    const option = renderToStaticMarkup(createElement(ChoiceOption, { type: 'radio', value: 'yes', label: 'Sim', id: 'damages-yes' }))
    expect(option).toMatch(/<input[^>]*id="damages-yes"/)
    expect(option).toContain('<label for="damages-yes">Sim</label>')
    const filter = renderToStaticMarkup(createElement(FilterSelect, { label: 'Status', id: 'status' }, createElement('option', { value: '' }, 'Todos')))
    expect(filter).toContain('<label for="status">Status</label>')
    expect(filter).toContain('<select id="status">')
  })

  it('groups choices under a legend with one error', () => {
    const html = renderToStaticMarkup(createElement(ChoiceGroup, { legend: 'Possui danos?', error: 'Informe.' }, createElement('input', { type: 'radio' })))
    expect(html).toContain('<legend>Possui danos?')
    expect(html).toContain('role="alert"')
  })
})
