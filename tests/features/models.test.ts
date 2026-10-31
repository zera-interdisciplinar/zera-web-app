import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createHttpClient } from '../../src/services/httpClient'
import { ApiError } from '../../src/utils/apiError'
import { categoryFormSchema, modelFormSchema } from '../../src/utils/modelValidation'
import { settingsFormSchema, unitSettingsSchema } from '../../src/utils/settingsValidation'
import { toCreateModelRequest, toModelPatches } from '../../src/utils/modelRequests'
import { APPROVAL_LABEL } from '../../src/utils/modelLabels'
import { modelSchema, APPROVAL_STATUSES } from '../../src/utils/itemSchemas'
import { ConfirmDeleteDialog } from '../../src/components/ConfirmDeleteDialog'
import type { ModelFormInput } from '../../src/types/model'
import type { Model } from '../../src/types/item'

const holder = vi.hoisted(() => ({ client: undefined as unknown }))
vi.mock('../../src/services/http', () => ({ http: { request: (...args: unknown[]) => (holder.client as { request: (...a: unknown[]) => unknown }).request(...args) } }))

const { createModel, listModelItems, listModels, removeModel, renameModel, setModelLifespan, setModelManufacturer, setModelMaterials, setModelWarranty } = await import('../../src/services/models')
const { createCategory, removeCategory, renameCategory, setCategoryDescription } = await import('../../src/services/categories')
const { getUnitSettings, saveUnitSettings } = await import('../../src/services/settings')
const { deleteFailureMessage } = await import('../../src/hooks/useModelMutations')

const contract = JSON.parse(readFileSync(new URL('../fixtures/openapi/inventory.json', import.meta.url), 'utf8').replace(/^\uFEFF/, '')) as {
  components: { schemas: Record<string, { required?: string[]; properties: Record<string, { enum?: string[]; minimum?: number; maxLength?: number }> }> }
  paths: Record<string, Record<string, unknown>>
}
const schemas = contract.components.schemas

const category = { id: 'cat-1', name: 'Eletrônicos', description: 'Aparelhos' }
const material = { id: 'm1', code: 'METAL', name: 'Metal', recyclable: true, hazardous: false }
const model: Model = modelSchema.parse({ id: 'model-1', name: 'ThinkPad', manufacturer: 'Lenovo', materials: [material], category, approvalStatus: 'APPROVED', warrantyMonths: 12, expectedLifespanMonths: 60 })

const validModel = (over: Partial<ModelFormInput> = {}): ModelFormInput => ({
  name: ' ThinkPad ', manufacturer: 'Lenovo', categoryId: 'cat-1', materials: ['METAL'], estimatedWeightKg: '', warrantyMonths: '', expectedLifespanMonths: '', notes: '', ...over,
})
const issuePaths = (schema: typeof modelFormSchema | typeof categoryFormSchema, input: unknown) => {
  const result = schema.safeParse(input)
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join('.'))
}

describe('category form (BR-16)', () => {
  it('requires both name and description, because the API does', () => {
    expect([...(schemas.CreateCategoryRequest.required ?? [])].sort()).toEqual(['description', 'name'])
    expect(issuePaths(categoryFormSchema, { name: '', description: '' })).toEqual(expect.arrayContaining(['name', 'description']))
    expect(issuePaths(categoryFormSchema, { name: 'x'.repeat(121), description: 'd' })).toEqual(['name'])
    expect(categoryFormSchema.parse({ name: '  Móveis ', description: ' Mobiliário ' })).toEqual({ name: 'Móveis', description: 'Mobiliário' })
  })
})

describe('model form (BR-17)', () => {
  it('requires name, manufacturer, category and materials, like CreateModelRequest', () => {
    expect([...(schemas.CreateModelRequest.required ?? [])].sort()).toEqual(['categoryId', 'manufacturer', 'materials', 'name'])
    expect(issuePaths(modelFormSchema, validModel({ name: '', manufacturer: ' ', categoryId: '', materials: [] }))).toEqual(expect.arrayContaining(['name', 'manufacturer', 'categoryId', 'materials']))
    expect(modelFormSchema.safeParse(validModel()).success).toBe(true)
  })

  it.each([
    ['zero warranty', { warrantyMonths: '0' }, 'warrantyMonths'],
    ['fractional warranty', { warrantyMonths: '1.5' }, 'warrantyMonths'],
    ['negative lifespan', { expectedLifespanMonths: '-3' }, 'expectedLifespanMonths'],
    ['zero weight', { estimatedWeightKg: '0' }, 'estimatedWeightKg'],
    ['text as weight', { estimatedWeightKg: 'abc' }, 'estimatedWeightKg'],
    ['notes above 500 characters', { notes: 'n'.repeat(501) }, 'notes'],
    ['an unknown material', { materials: ['WOOD' as never] }, 'materials.0'],
  ])('rejects %s', (_, over, path) => {
    expect(issuePaths(modelFormSchema, validModel(over as Partial<ModelFormInput>))).toContain(path)
  })

  it('treats empty optional inputs as not informed', () => {
    const values = modelFormSchema.parse(validModel())
    expect(values).toMatchObject({ name: 'ThinkPad', warrantyMonths: undefined, expectedLifespanMonths: undefined, estimatedWeightKg: undefined, notes: undefined })
  })

  it('builds the create body with only what was informed', () => {
    expect(toCreateModelRequest(modelFormSchema.parse(validModel()))).toEqual({ name: 'ThinkPad', manufacturer: 'Lenovo', categoryId: 'cat-1', materials: ['METAL'] })
    const full = toCreateModelRequest(modelFormSchema.parse(validModel({ estimatedWeightKg: '1.5', warrantyMonths: '12', expectedLifespanMonths: '60', notes: 'ok' })))
    expect(full).toEqual({ name: 'ThinkPad', manufacturer: 'Lenovo', categoryId: 'cat-1', materials: ['METAL'], estimatedWeightKg: 1.5, warrantyMonths: 12, expectedLifespanMonths: 60, notes: 'ok' })
    expect(Object.keys(full).filter((key) => !(key in schemas.CreateModelRequest.properties))).toEqual([])
  })

  it('turns an edit into one PATCH per changed field, and nothing when nothing changed', () => {
    const same = modelFormSchema.parse(validModel({ name: 'ThinkPad', warrantyMonths: '12', expectedLifespanMonths: '60' }))
    expect(toModelPatches(model, same)).toEqual([])
    const changed = modelFormSchema.parse(validModel({ name: 'ThinkPad X1', manufacturer: 'Lenovo Group', warrantyMonths: '24', expectedLifespanMonths: '72', materials: ['METAL', 'GLASS'] }))
    expect(toModelPatches(model, changed)).toEqual([
      { field: 'name', value: 'ThinkPad X1' }, { field: 'manufacturer', value: 'Lenovo Group' },
      { field: 'warrantyMonths', value: 24 }, { field: 'expectedLifespanMonths', value: 72 }, { field: 'materials', value: ['METAL', 'GLASS'] },
    ])
  })

  it('does not try to erase warranty or lifespan, which the API cannot do', () => {
    expect(toModelPatches(model, modelFormSchema.parse(validModel({ name: 'ThinkPad', warrantyMonths: '', expectedLifespanMonths: '' })))).toEqual([])
  })

  it('compares materials as a set', () => {
    const two = { ...model, materials: [material, { ...material, id: 'm2', code: 'GLASS' as const }] }
    expect(toModelPatches(two, modelFormSchema.parse(validModel({ name: 'ThinkPad', warrantyMonths: '12', expectedLifespanMonths: '60', materials: ['GLASS', 'METAL'] })))).toEqual([])
  })

  it('approval is read-only: there is no endpoint to change it', () => {
    expect(Object.keys(contract.paths).filter((path) => /models\/\{id\}\/(approve|reject|approval)/.test(path))).toEqual([])
    expect([...APPROVAL_STATUSES]).toEqual(schemas.ModelResponse.properties.approvalStatus.enum)
    for (const status of APPROVAL_STATUSES) expect(APPROVAL_LABEL[status]).toBeTruthy()
  })
})

describe('settings form (BR-18)', () => {
  it('accepts zero and whole numbers, and refuses empty, negative or fractional capacity', () => {
    expect(settingsFormSchema.parse({ stockCapacity: '0' })).toEqual({ stockCapacity: 0 })
    expect(settingsFormSchema.parse({ stockCapacity: '250' })).toEqual({ stockCapacity: 250 })
    for (const stockCapacity of ['', '-1', '1.5', 'abc']) expect(settingsFormSchema.safeParse({ stockCapacity }).success, stockCapacity).toBe(false)
    expect(schemas.UpdateUnitSettingsRequest.required).toEqual(['stockCapacity'])
    expect(schemas.UpdateUnitSettingsRequest.properties.stockCapacity.minimum).toBe(0)
  })

  it('reads a null capacity as "not configured", not zero', () => {
    const parsed = unitSettingsSchema.parse({ unitId: 'u', stockCapacity: null, configured: false })
    expect(parsed.stockCapacity).toBeNull()
    expect(unitSettingsSchema.safeParse({ stockCapacity: -1 }).success).toBe(false)
  })
})

describe('models and categories API against a fetch double', () => {
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  const call = (index: number) => { const url = fetchMock.mock.calls[index][0] as URL; return { url: url.pathname + url.search, init: fetchMock.mock.calls[index][1] as RequestInit } }
  const body = (index: number) => JSON.parse(call(index).init.body as string)

  beforeEach(() => {
    fetchMock = vi.fn<typeof fetch>()
    holder.client = createHttpClient({
      baseUrls: { administrative: '/api/administrative', inventory: '/api/inventory', analytics: '/api/analytics' },
      session: { getAccessToken: () => 'token', getUnitId: () => 'unit-1', refresh: async () => false, onExpired: () => undefined },
      fetchImpl: fetchMock, sleep: async () => undefined, origin: 'https://app.example.invalid',
    })
  })

  it('lists models with server-side pagination and the approval filter', async () => {
    fetchMock.mockResolvedValue(json({ content: [model], page: 1, size: 20, totalElements: 21, totalPages: 2 }))
    const page = await listModels({ page: 1, size: 20, approvalStatus: 'PENDING' })
    expect(page.totalElements).toBe(21)
    expect(call(0).url).toBe('/api/inventory/api/v1/models?page=1&size=20&approvalStatus=PENDING')
  })

  it('refuses a model with an approval status outside the contract', async () => {
    fetchMock.mockResolvedValue(json({ content: [{ ...model, approvalStatus: 'PENDING_APPROVAL' }], page: 0, size: 20, totalElements: 1, totalPages: 1 }))
    await expect(listModels({ page: 0, size: 20 })).rejects.toMatchObject({ kind: 'contract' })
  })

  it.each([
    ['rename', () => renameModel('m', 'N'), '/models/m/name', { name: 'N' }],
    ['manufacturer', () => setModelManufacturer('m', 'F'), '/models/m/manufacturer', { manufacturer: 'F' }],
    ['warranty', () => setModelWarranty('m', 12), '/models/m/warranty-months', { warrantyMonths: 12 }],
    ['lifespan', () => setModelLifespan('m', 60), '/models/m/expected-lifespan-months', { expectedLifespanMonths: 60 }],
    ['materials', () => setModelMaterials('m', ['GLASS']), '/models/m/materials', { materials: ['GLASS'] }],
  ])('%s has its own PATCH', async (_, run, suffix, expected) => {
    fetchMock.mockResolvedValue(json(model))
    await run()
    expect(call(0)).toMatchObject({ url: `/api/inventory/api/v1${suffix}`, init: { method: 'PATCH' } })
    expect(body(0)).toEqual(expected)
    expect(`/api/v1${suffix.replace('/m/', '/{id}/')}` in contract.paths).toBe(true)
  })

  it('creates a model and never puts the unit in the body', async () => {
    fetchMock.mockResolvedValue(json(model, 201))
    await createModel(toCreateModelRequest(modelFormSchema.parse(validModel())))
    expect(call(0)).toMatchObject({ url: '/api/inventory/api/v1/models', init: { method: 'POST' } })
    expect(body(0)).not.toHaveProperty('unitId')
    expect((call(0).init.headers as Record<string, string>)['X-Unit-Id']).toBe('unit-1')
  })

  it('lists the items of a model page by page', async () => {
    fetchMock.mockResolvedValue(json({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }))
    await listModelItems('m/1', 0, 20)
    expect(call(0).url).toBe('/api/inventory/api/v1/models/m%2F1/items?page=0&size=20')
  })

  it('deletes models and categories, and keeps the 409 for the caller', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(json({ status: 409, title: 'Conflict' }, 409))
    await removeModel('m')
    expect(call(0)).toMatchObject({ url: '/api/inventory/api/v1/models/m', init: { method: 'DELETE' } })
    await expect(removeCategory('c')).rejects.toMatchObject({ status: 409 })
    expect(call(1)).toMatchObject({ url: '/api/inventory/api/v1/categories/c', init: { method: 'DELETE' } })
  })

  it('creates and edits categories through their own endpoints', async () => {
    fetchMock.mockImplementation(async () => json(category))
    await createCategory({ name: 'N', description: 'D' })
    await renameCategory('c', 'N2')
    await setCategoryDescription('c', 'D2')
    expect([call(0), call(1), call(2)].map((entry) => `${entry.init.method} ${entry.url}`)).toEqual([
      'POST /api/inventory/api/v1/categories', 'PATCH /api/inventory/api/v1/categories/c/name', 'PATCH /api/inventory/api/v1/categories/c/description',
    ])
    expect([body(0), body(1), body(2)]).toEqual([{ name: 'N', description: 'D' }, { name: 'N2' }, { description: 'D2' }])
  })

  it('reads and saves the stock capacity with PUT', async () => {
    fetchMock.mockResolvedValueOnce(json({ unitId: 'u', stockCapacity: null, configured: false }))
      .mockResolvedValueOnce(json({ unitId: 'u', stockCapacity: 300, configured: true, updatedByName: 'Ana', updatedAt: '2026-10-28T14:12:00Z' }))
    expect((await getUnitSettings()).stockCapacity).toBeNull()
    const saved = await saveUnitSettings(300)
    expect(saved.stockCapacity).toBe(300)
    expect(call(1)).toMatchObject({ url: '/api/inventory/api/v1/unit-settings', init: { method: 'PUT' } })
    expect(body(1)).toEqual({ stockCapacity: 300 })
  })
})

describe('delete feedback', () => {
  it('explains a 409 and falls back to a generic message otherwise', () => {
    expect(deleteFailureMessage(new ApiError('x', { kind: 'http', status: 409 }), 'Em uso.')).toBe('Em uso.')
    expect(deleteFailureMessage(new ApiError('x', { kind: 'network' }), 'Em uso.')).toMatch(/servidor/)
  })

  it('shows the server refusal inside the dialog as an alert', () => {
    const html = renderToStaticMarkup(createElement(ConfirmDeleteDialog, { title: 'Excluir', message: 'Certeza?', pending: false, error: 'Em uso.', onConfirm: () => undefined, onClose: () => undefined }))
    expect(html).toContain('role="alert"')
    expect(html).toContain('Em uso.')
  })
})
