import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createHttpClient } from '../../src/services/httpClient'
import { ApiError } from '../../src/utils/apiError'
import type { SessionPort } from '../../src/types/http'

const baseUrls = { administrative: '/api/administrative', inventory: '/api/inventory', analytics: '/api/analytics' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>
let session: SessionPort & { token: string | null; unit: string | null; expired: number; refreshes: number; renewTo: string | null }

function makeClient() {
  return createHttpClient({ baseUrls, session, fetchImpl: fetchMock, sleep: async () => undefined, origin: 'https://app.example.invalid' })
}
const headersOf = (call: number) => (fetchMock.mock.calls[call][1]?.headers ?? {}) as Record<string, string>
const urlOf = (call: number) => fetchMock.mock.calls[call][0] as URL

beforeEach(() => {
  fetchMock = vi.fn<typeof fetch>()
  session = {
    token: 'access-1', unit: 'unit-1', expired: 0, refreshes: 0, renewTo: 'access-2',
    getAccessToken() { return this.token },
    getUnitId() { return this.unit },
    async refresh() { this.refreshes += 1; this.token = this.renewTo; return this.renewTo !== null },
    onExpired() { this.expired += 1 },
  }
})

describe('headers and URL (BR-09, BR-23)', () => {
  it('sends the bearer token and the unit of the session to the inventory service', async () => {
    fetchMock.mockResolvedValue(json({ ok: true }))
    await makeClient().request('inventory', '/api/v1/items', { query: { page: 0, size: 20, q: '', status: undefined } })
    expect(urlOf(0).toString()).toBe('https://app.example.invalid/api/inventory/api/v1/items?page=0&size=20')
    expect(headersOf(0)).toMatchObject({ Authorization: 'Bearer access-1', 'X-Unit-Id': 'unit-1', Accept: 'application/json' })
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'omit', redirect: 'error', cache: 'no-store', method: 'GET' })
  })

  it('does not send the unit to other services unless asked', async () => {
    fetchMock.mockImplementation(async () => json({}))
    await makeClient().request('administrative', '/api/v1/users/1')
    expect(headersOf(0)).not.toHaveProperty('X-Unit-Id')
    await makeClient().request('administrative', '/api/v1/users/1', { unit: true })
    expect(headersOf(1)).toHaveProperty('X-Unit-Id', 'unit-1')
  })

  it('fails before the request when an inventory call has no unit', async () => {
    session.unit = null
    await expect(makeClient().request('inventory', '/api/v1/items')).rejects.toMatchObject({ kind: 'config' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([{ unitId: 'other' }, { UnitId: 'other' }, { unitid: 'other' }])('refuses a unitId in the body %j', async (body) => {
    await expect(makeClient().request('inventory', '/api/v1/items', { method: 'POST', body })).rejects.toThrow('X-Unit-Id')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('never puts the token in the URL', async () => {
    fetchMock.mockResolvedValue(json({}))
    await makeClient().request('analytics', '/api/v1/dashboard/overview', { query: { period: '6m' } })
    expect(urlOf(0).toString()).not.toMatch(/access_token|access-1/)
  })

  it('skips the token on public routes and serializes the JSON body', async () => {
    fetchMock.mockResolvedValue(json({ accessToken: 'a' }))
    await makeClient().request('administrative', '/api/v1/auth/login', { method: 'POST', body: { email: 'a@b.c', password: 'x' }, auth: false })
    expect(headersOf(0)).not.toHaveProperty('Authorization')
    expect(headersOf(0)['Content-Type']).toBe('application/json')
    expect(fetchMock.mock.calls[0][1]?.body).toBe('{"email":"a@b.c","password":"x"}')
  })

  it('refuses remote http and accepts localhost http', async () => {
    fetchMock.mockResolvedValue(json({}))
    const remote = createHttpClient({ baseUrls: { ...baseUrls, inventory: 'http://remote.example.invalid' }, session, fetchImpl: fetchMock })
    await expect(remote.request('inventory', '/x')).rejects.toMatchObject({ kind: 'config' })
    const local = createHttpClient({ baseUrls: { ...baseUrls, inventory: 'http://localhost:8080' }, session, fetchImpl: fetchMock })
    await local.request('inventory', '/x')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('fails without a token instead of calling the API', async () => {
    session.token = null
    await expect(makeClient().request('inventory', '/api/v1/items')).rejects.toMatchObject({ kind: 'session', status: 401 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('retries', () => {
  it('retries GET on 502, 503 and 504, at most twice', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 502 })).mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(json({ ok: 1 }))
    expect(await makeClient().request('inventory', '/api/v1/items')).toEqual({ ok: 1 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    fetchMock.mockReset().mockResolvedValue(new Response('', { status: 504 }))
    await expect(makeClient().request('inventory', '/api/v1/items')).rejects.toMatchObject({ kind: 'http', status: 504 })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('retries a network failure on GET and reports kind network afterwards', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(makeClient().request('inventory', '/api/v1/items')).rejects.toMatchObject({ kind: 'network' })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it.each(['POST', 'PATCH', 'PUT', 'DELETE'] as const)('never retries %s', async (method) => {
    fetchMock.mockResolvedValue(new Response('', { status: 503 }))
    await expect(makeClient().request('inventory', '/api/v1/items/1', { method })).rejects.toMatchObject({ status: 503 })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    fetchMock.mockReset().mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(makeClient().request('inventory', '/api/v1/items/1', { method })).rejects.toMatchObject({ kind: 'network' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('does not retry or wrap an abort', async () => {
    const controller = new AbortController()
    controller.abort()
    fetchMock.mockRejectedValue(new DOMException('aborted', 'AbortError'))
    await expect(makeClient().request('inventory', '/api/v1/items', { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports a timeout', async () => {
    fetchMock.mockRejectedValue(new DOMException('timeout', 'TimeoutError'))
    await expect(makeClient().request('inventory', '/api/v1/items/1', { method: 'POST' })).rejects.toMatchObject({ kind: 'timeout' })
  })
})

describe('session renewal (BR-20, BR-21)', () => {
  it('renews once on 401 and repeats the request with the new token', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 401 })).mockResolvedValueOnce(json({ ok: true }))
    expect(await makeClient().request('inventory', '/api/v1/items')).toEqual({ ok: true })
    expect(session.refreshes).toBe(1)
    expect(headersOf(1).Authorization).toBe('Bearer access-2')
    expect(session.expired).toBe(0)
  })

  it('shares a single refresh between concurrent 401s', async () => {
    let release: (() => void) | undefined
    session.refresh = vi.fn(async () => { await new Promise<void>((resolve) => { release = resolve }); session.token = 'access-2'; return true })
    fetchMock.mockImplementation(async (_url, init) => {
      const token = (init?.headers as Record<string, string>).Authorization
      return token === 'Bearer access-1' ? new Response('', { status: 401 }) : json({ ok: true })
    })
    const client = makeClient()
    const calls = Promise.all([client.request('inventory', '/a'), client.request('inventory', '/b'), client.request('inventory', '/c')])
    await vi.waitFor(() => expect(release).toBeDefined())
    release!()
    await calls
    expect(session.refresh).toHaveBeenCalledTimes(1)
  })

  it('ends the session when the refresh fails', async () => {
    session.renewTo = null
    fetchMock.mockResolvedValue(new Response('', { status: 401 }))
    await expect(makeClient().request('inventory', '/api/v1/items')).rejects.toMatchObject({ kind: 'session' })
    expect(session.expired).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('ends the session on the second 401 without looping', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 401 }))
    await expect(makeClient().request('inventory', '/api/v1/items')).rejects.toMatchObject({ kind: 'session' })
    expect(session.refreshes).toBe(1)
    expect(session.expired).toBe(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('does not try to renew a 401 from a public route', async () => {
    fetchMock.mockResolvedValue(json({ message: 'Unauthorized' }, 401))
    await expect(makeClient().request('administrative', '/api/v1/auth/login', { method: 'POST', body: {}, auth: false })).rejects.toMatchObject({ kind: 'http', status: 401 })
    expect(session.refreshes).toBe(0)
    expect(session.expired).toBe(0)
  })
})

describe('responses (BR-24)', () => {
  it('maps a 422 with the missing fields and a 400 with field errors', async () => {
    fetchMock.mockResolvedValueOnce(json({ status: 422, detail: 'Item is missing required fields', missingFields: ['name', 'usageIntensity'] }, 422))
    await expect(makeClient().request('inventory', '/api/v1/items/1/submit', { method: 'POST' })).rejects.toMatchObject({ status: 422, missingFields: ['name', 'usageIntensity'] })
    fetchMock.mockResolvedValueOnce(json({ status: 400, detail: 'email: must not be blank' }, 400))
    await expect(makeClient().request('administrative', '/api/v1/auth/login', { method: 'POST', body: {}, auth: false })).rejects.toMatchObject({ fieldErrors: { email: 'must not be blank' } })
  })

  it('returns undefined for 204 and for an empty body', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 })).mockResolvedValueOnce(new Response('', { status: 200 }))
    expect(await makeClient().request('inventory', '/api/v1/items/1', { method: 'DELETE' })).toBeUndefined()
    expect(await makeClient().request('administrative', '/api/v1/auth/logout', { method: 'POST', body: { refreshToken: 'r' } })).toBeUndefined()
  })

  it('validates the body with the schema and returns typed data', async () => {
    fetchMock.mockResolvedValue(json({ id: 'a', name: null }))
    const data = await makeClient().request('inventory', '/api/v1/items/a', { schema: z.object({ id: z.string(), name: z.string().nullable() }) })
    expect(data).toEqual({ id: 'a', name: null })
  })

  it('turns a body outside the contract into a contract error, never partial data', async () => {
    fetchMock.mockResolvedValue(json({ id: 1 }))
    const error = await makeClient().request('inventory', '/api/v1/items/a', { schema: z.object({ id: z.string() }) }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'contract', status: 200 })
    expect((error as ApiError).detail).toContain('id')
  })

  it('reports invalid JSON as a contract error', async () => {
    fetchMock.mockResolvedValue(new Response('<html>', { status: 200 }))
    await expect(makeClient().request('inventory', '/api/v1/items')).rejects.toMatchObject({ kind: 'contract' })
  })

  it('keeps text from the API untouched (no destructive sanitizing)', async () => {
    fetchMock.mockResolvedValue(json({ notes: 'Data: 12/05 <3 a & b' }))
    expect(await makeClient().request('inventory', '/api/v1/items/1')).toEqual({ notes: 'Data: 12/05 <3 a & b' })
  })
})

describe('explicit token (right after login)', () => {
  it('uses the given token instead of the session and does not renew on 401', async () => {
    session.token = null
    fetchMock.mockResolvedValue(json({ message: 'Unauthorized' }, 401))
    await expect(makeClient().request('administrative', '/api/v1/users/u', { accessToken: 'fresh' })).rejects.toMatchObject({ kind: 'http', status: 401 })
    expect(headersOf(0).Authorization).toBe('Bearer fresh')
    expect(session.refreshes).toBe(0)
    expect(session.expired).toBe(0)
  })
})
