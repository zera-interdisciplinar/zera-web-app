import { afterEach, describe, expect, it, vi } from 'vitest'
import { refreshTokenStorage } from '../../src/services/refreshTokenStorage'
import { createSessionStore } from '../../src/services/sessionStore'
import { describeApiError, ApiError, isAbortError } from '../../src/utils/apiError'
import { formatDate, formatDateTime, formatRelativeTime, NOT_AVAILABLE } from '../../src/utils/format'

afterEach(() => vi.unstubAllGlobals())

const request = vi.hoisted(() => vi.fn())
vi.mock('../../src/services/http', () => ({ http: { request } }))
const { fetchUser, login, logout, refresh } = await import('../../src/services/auth')

describe('identity API calls', () => {
  const tokens = { userId: 'u', accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer', expiresIn: 900 }

  it('sends each call to its allowlisted route without a bearer token, except the user lookup', async () => {
    request.mockReset().mockResolvedValue(tokens)
    await login('a@b.c', 'pw')
    await refresh('r1')
    await logout('r2')
    await fetchUser('user/1', 'tok')
    expect(request.mock.calls.map(([service, path, options]) => [service, path, options.method ?? 'GET', options.auth, options.body])).toEqual([
      ['administrative', '/api/v1/auth/login', 'POST', false, { email: 'a@b.c', password: 'pw' }],
      ['administrative', '/api/v1/auth/refresh', 'POST', false, { refreshToken: 'r1' }],
      ['administrative', '/api/v1/auth/logout', 'POST', false, { refreshToken: 'r2' }],
      ['administrative', '/api/v1/users/user%2F1', 'GET', undefined, undefined],
    ])
    expect(request.mock.calls[3][2].accessToken).toBe('tok')
  })

  it('gives the logout a short timeout, so closing the session never hangs', async () => {
    request.mockReset().mockResolvedValue(undefined)
    await logout('r')
    expect(request.mock.calls[0][2].timeoutMs).toBeLessThanOrEqual(5_000)
  })

  it('always throws an ApiError, wrapping anything else, and lets an abort through untouched', async () => {
    request.mockReset().mockRejectedValueOnce(new TypeError('boom'))
    await expect(login('a@b.c', 'pw')).rejects.toBeInstanceOf(ApiError)
    const abort = new DOMException('stopped', 'AbortError')
    request.mockRejectedValueOnce(abort)
    await expect(refresh('r')).rejects.toBe(abort)
    const failure = new ApiError('x', { kind: 'http', status: 401 })
    request.mockRejectedValueOnce(failure)
    await expect(fetchUser('u', 't')).rejects.toBe(failure)
  })
})

describe('refresh token storage (BR-21)', () => {
  it('keeps the token in the tab storage and clears it', () => {
    const data = new Map<string, string>()
    vi.stubGlobal('window', { sessionStorage: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value), removeItem: (key: string) => void data.delete(key) } })
    expect(refreshTokenStorage.read()).toBeNull()
    refreshTokenStorage.write('r1')
    expect(refreshTokenStorage.read()).toBe('r1')
    expect([...data.keys()]).toEqual(['zera.session.refresh'])
    refreshTokenStorage.clear()
    expect(refreshTokenStorage.read()).toBeNull()
  })

  it('survives a storage that throws (private mode)', () => {
    const boom = () => { throw new Error('blocked') }
    vi.stubGlobal('window', { sessionStorage: { getItem: boom, setItem: boom, removeItem: boom } })
    expect(refreshTokenStorage.read()).toBeNull()
    expect(() => refreshTokenStorage.write('r')).not.toThrow()
    expect(() => refreshTokenStorage.clear()).not.toThrow()
  })
})

describe('session store', () => {
  it('notifies subscribers on change and expiry observers on expiry, and lets them leave', () => {
    const store = createSessionStore({ status: 'anonymous', session: null, notice: null })
    const changed = vi.fn()
    const expired = vi.fn()
    const stopChanged = store.subscribe(changed)
    const stopExpired = store.onExpired(expired)
    store.setState({ status: 'restoring', session: null, notice: null })
    store.notifyExpired()
    expect(store.getState().status).toBe('restoring')
    expect(changed).toHaveBeenCalledTimes(1)
    expect(expired).toHaveBeenCalledTimes(1)
    stopChanged()
    stopExpired()
    store.setState({ status: 'anonymous', session: null, notice: 'x' })
    store.notifyExpired()
    expect(changed).toHaveBeenCalledTimes(1)
    expect(expired).toHaveBeenCalledTimes(1)
  })
})

describe('error messages', () => {
  const http = (status: number) => new ApiError('x', { kind: 'http', status })

  it.each([
    [new ApiError('x', { kind: 'network' }), /conexão/],
    [new ApiError('x', { kind: 'timeout' }), /demorou/],
    [new ApiError('x', { kind: 'contract' }), /contrato/],
    [new ApiError('mensagem própria', { kind: 'config' }), /mensagem própria/],
    [new ApiError('x', { kind: 'session' }), /sessão expirou/],
    [http(400), /Revise/], [http(401), /sessão expirou/], [http(403), /permissão/], [http(404), /Não encontramos/],
    [http(409), /estado mudou/], [http(413), /grande demais/], [http(422), /obrigatórias/], [http(503), /indisponível/], [http(418), /HTTP 418/],
    [new Error('x'), /Algo deu errado/],
  ])('describes %# in Portuguese, without leaking the server text', (error, expected) => {
    expect(describeApiError(error)).toMatch(expected)
  })

  it('recognizes an aborted request', () => {
    expect(isAbortError(new DOMException('x', 'AbortError'))).toBe(true)
    expect(isAbortError(new Error('x'))).toBe(false)
  })
})

describe('shared formatting', () => {
  it('prints a relative time in Portuguese from minutes up to days', () => {
    const now = Date.parse('2026-10-28T12:00:00Z')
    expect(formatRelativeTime('2026-10-28T11:30:00Z', now)).toMatch(/30 minutos/)
    expect(formatRelativeTime('2026-10-28T09:00:00Z', now)).toMatch(/3 horas/)
    expect(formatRelativeTime('2026-10-26T12:00:00Z', now)).toMatch(/anteontem|2 dias/)
    expect(formatRelativeTime('nope', now)).toBe(NOT_AVAILABLE)
  })

  it('prints a calendar date as is, without a timezone shift, and a date-time with the time', () => {
    expect(formatDate('2026-10-28')).toBe('28/10/2026')
    expect(formatDate('lixo')).toBe(NOT_AVAILABLE)
    expect(formatDateTime('2026-10-28T14:12:00Z')).toMatch(/28\/10\/2026/)
    expect(formatDateTime('lixo')).toBe(NOT_AVAILABLE)
  })
})
