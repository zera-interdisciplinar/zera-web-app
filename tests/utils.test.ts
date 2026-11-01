import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { openOverviewStream } from '../src/services/dashboard'
import { initialRequest, requestReducer } from '../src/reducers/requestReducer'
import { ApiError } from '../src/utils/apiError'
import { itemSchema } from '../src/utils/itemSchemas'
import { safeImageUrl } from '../src/utils/safeUrl'
import { categoryFormSchema, modelFormSchema } from '../src/utils/modelValidation'
import { settingsFormSchema } from '../src/utils/settingsValidation'
import { loginSchema } from '../src/utils/loginValidation'
import { resolverFor, validate } from '../src/utils/validation'
import type { SseClient } from '../src/types/http'

describe('safeImageUrl (XSS)', () => {
  it.each([
    ['https://cdn.example.invalid/a.png', 'https://cdn.example.invalid/a.png'],
    ['http://localhost/a.png', 'http://localhost/a.png'],
    ['/relative/photo.jpg', '/relative/photo.jpg'],
    ['javascript:alert(1)', null],
    ['JaVaScRiPt:alert(1)', null],
    ['data:text/html;base64,PHNjcmlwdD4=', null],
    ['vbscript:x', null],
    ['', null],
    [null, null],
    [undefined, null],
  ])('%j → %j', (value, expected) => {
    expect(safeImageUrl(value)).toBe(expected)
  })

  it('is applied to the photo of every item read from the API', () => {
    const base = { id: 'a', barcode: 'b', status: 'DRAFT', unitId: 'u', createdAt: '2026-10-28T14:12:00Z', updatedAt: '2026-10-28T14:12:00Z' }
    expect(itemSchema.parse({ ...base, photoUrl: 'javascript:alert(1)' }).photoUrl).toBeNull()
    expect(itemSchema.parse({ ...base, photoUrl: 'https://cdn.example.invalid/a.png' }).photoUrl).toBe('https://cdn.example.invalid/a.png')
  })
})

describe('validate and resolverFor', () => {
  const schema = z.object({ name: z.string().trim().min(1, 'Informe o nome.').max(12, 'Nome longo demais.'), nested: z.object({ code: z.string().min(2, 'Código curto.') }) })

  it('returns one message per field path, the most specific first, and cleans accepted text', () => {
    const bad = validate(schema, { name: '', nested: { code: 'x' } })
    expect(bad).toEqual({ ok: false, errors: { name: 'Informe o nome.', 'nested.code': 'Código curto.' } })
    const good = validate(schema, { name: ' <b>Ana</b> ', nested: { code: 'ok' } })
    expect(good).toEqual({ ok: true, data: { name: 'Ana', nested: { code: 'ok' } } })
  })

  it('rejects required text that becomes empty after sanitization, before a service can receive it', () => {
    expect(validate(categoryFormSchema, { name: '<b></b>', description: 'Eletrônicos' })).toEqual({ ok: false, errors: { name: 'Informe o nome.' } })
    expect(validate(categoryFormSchema, { name: 'Equipamentos', description: '<i> </i>' })).toEqual({ ok: false, errors: { description: 'Informe a descrição.' } })
  })

  it('sanitizes raw input once, before numeric preprocessing and optional-field transforms', () => {
    const result = validate(modelFormSchema, { name: '<b>Notebook</b>', manufacturer: ' Zera ', categoryId: 'cat-1', materials: ['METAL'], estimatedWeightKg: '1.5', warrantyMonths: '12', expectedLifespanMonths: '', notes: '<i></i>' })
    expect(result).toMatchObject({ ok: true, data: { name: 'Notebook', manufacturer: 'Zera', estimatedWeightKg: 1.5, warrantyMonths: 12, expectedLifespanMonths: undefined, notes: undefined } })
    if (result.ok) expect(modelFormSchema.safeParse({ ...result.data, estimatedWeightKg: '1.5', warrantyMonths: '12' }).success).toBe(true)
    expect(validate(settingsFormSchema, { stockCapacity: ' 0 ' })).toEqual({ ok: true, data: { stockCapacity: 0 } })
  })

  it('keeps authentication passwords exactly as typed, outside generic text sanitization', () => {
    const password = ' <b> senha </b> '
    expect(loginSchema.parse({ email: 'gestor@example.invalid', password }).password).toBe(password)
  })

  it('builds the react-hook-form errors, nested, from the same messages', async () => {
    const resolver = resolverFor(schema)
    const options = { fields: {}, shouldUseNativeValidation: false } as never
    const rejected = await resolver({ name: 'abcdefghijklm', nested: { code: '' } }, undefined, options)
    expect(rejected.values).toEqual({})
    expect(rejected.errors).toMatchObject({ name: { message: 'Nome longo demais.' }, nested: { code: { message: 'Código curto.' } } })
    const accepted = await resolver({ name: 'Ana', nested: { code: 'ok' } }, undefined, options)
    expect(accepted).toEqual({ values: { name: 'Ana', nested: { code: 'ok' } }, errors: {} })
  })
})

describe('request reducer', () => {
  it('moves between loading, success and error without mutating the state it received', () => {
    const loading = Object.freeze(initialRequest)
    const success = requestReducer(loading, { type: 'success', data: [1] })
    expect(success).toEqual({ status: 'success', data: [1] })
    expect(requestReducer(success, { type: 'start' })).toEqual({ status: 'loading' })
    expect(requestReducer(loading, { type: 'start' })).toBe(loading)
    expect(requestReducer(success, { type: 'failure', message: 'x' })).toEqual({ status: 'error', message: 'x' })
  })
})

describe('dashboard service (BR-05, BR-06)', () => {
  it('opens the analytics overview stream with the filters, the signal and the handlers', async () => {
    const connect = vi.fn().mockResolvedValue(undefined)
    const client = { connect } as unknown as SseClient
    const controller = new AbortController()
    const handlers = { onEvent: vi.fn(), onFatal: vi.fn() }
    await openOverviewStream({ period: '6m', view: 'todos' }, controller.signal, handlers, client)
    expect(connect).toHaveBeenCalledWith('analytics', '/api/v1/dashboard/overview', { query: { period: '6m', view: 'todos' }, signal: controller.signal, handlers })
  })

  it('throws an ApiError when the client breaks in an unexpected way', async () => {
    const client = { connect: vi.fn().mockRejectedValue(new TypeError('boom')) } as unknown as SseClient
    await expect(openOverviewStream({}, new AbortController().signal, { onEvent: vi.fn(), onFatal: vi.fn() }, client)).rejects.toBeInstanceOf(ApiError)
  })
})
