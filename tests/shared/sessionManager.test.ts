import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../src/shared/api/errors'
import type { AuthApi } from '../../src/shared/auth/authApi'
import { AuthRejectedError } from '../../src/shared/auth/gate'
import type { TokenResponse, UserOutput } from '../../src/shared/auth/schemas'
import { createSessionManager, type RefreshTokenStorage } from '../../src/shared/auth/sessionManager'
import { createSessionStore } from '../../src/shared/auth/sessionStore'

const manager: UserOutput = { userId: 'user-1', name: 'Natalia Flores', email: 'natalia@example.invalid', role: 'MANAGER', status: 'ACTIVE', unitId: 'unit-1' }
const tokens = (n: number, userId = 'user-1'): TokenResponse => ({ userId, accessToken: `access-${n}`, refreshToken: `refresh-${n}`, tokenType: 'Bearer', expiresIn: 3600 })
const httpError = (status: number) => new ApiError(`HTTP ${status}`, { kind: 'http', status })

let api: { [K in keyof AuthApi]: ReturnType<typeof vi.fn> }
let storage: RefreshTokenStorage & { value: string | null }
let clearCache: ReturnType<typeof vi.fn>
let timers: Array<{ callback: () => void; ms: number; cleared: boolean }>
let clock: number
let store: ReturnType<typeof createSessionStore>
let sut: ReturnType<typeof createSessionManager>

function setup(initialToken: string | null = null) {
  api = { login: vi.fn(), refresh: vi.fn(), logout: vi.fn().mockResolvedValue(undefined), fetchUser: vi.fn().mockResolvedValue(manager) }
  storage = { value: initialToken, read() { return this.value }, write(token) { this.value = token }, clear() { this.value = null } }
  clearCache = vi.fn()
  timers = []
  clock = 1_000_000
  store = createSessionStore({ status: initialToken ? 'restoring' : 'anonymous', session: null, notice: null })
  sut = createSessionManager({
    api: api as unknown as AuthApi, store, storage, clearCache: clearCache as unknown as () => void,
    now: () => clock,
    setTimer: (callback, ms) => { const timer = { callback, ms, cleared: false }; timers.push(timer); return timer },
    clearTimer: (handle) => { (handle as { cleared: boolean }).cleared = true },
  })
}
beforeEach(() => setup())

describe('signIn (BR-01, BR-02)', () => {
  it('opens the session for an active manager and keeps only the refresh token in the tab', async () => {
    api.login.mockResolvedValue(tokens(1))
    const user = await sut.signIn('natalia@example.invalid', 'secret')
    expect(user).toEqual({ id: 'user-1', name: 'Natalia Flores', email: 'natalia@example.invalid', role: 'MANAGER', unitId: 'unit-1' })
    expect(api.fetchUser).toHaveBeenCalledWith('user-1', 'access-1')
    expect(store.getState()).toMatchObject({ status: 'authenticated', notice: null, session: { accessToken: 'access-1', refreshToken: 'refresh-1', expiresAt: clock + 3_600_000 } })
    expect(storage.value).toBe('refresh-1')
    expect(sut.port.getAccessToken()).toBe('access-1')
    expect(sut.port.getUnitId()).toBe('unit-1')
  })

  it.each([
    ['EMPLOYEE', { role: 'EMPLOYEE' }, 'not-manager', 'exclusiva para gestores'],
    ['an unknown role', { role: 'ADMIN' }, 'not-manager', 'exclusiva para gestores'],
    ['an inactive account', { status: 'INACTIVE' }, 'inactive', 'inativa'],
    ['a suspended account', { status: 'SUSPENDED' }, 'inactive', 'inativa'],
    ['a manager without unit', { unitId: null }, 'no-unit', 'unidade'],
    ['another user than the token owner', { userId: 'someone-else' }, 'identity-mismatch', 'identidade'],
  ])('refuses %s, revokes the tokens on the server and leaves nothing behind', async (_label, override, reason, text) => {
    api.login.mockResolvedValue(tokens(1))
    api.fetchUser.mockResolvedValue({ ...manager, ...override })
    const error = await sut.signIn('a@b.c', 'x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(AuthRejectedError)
    expect(error).toMatchObject({ reason })
    expect((error as Error).message).toContain(text)
    expect(api.logout).toHaveBeenCalledWith('refresh-1')
    expect(storage.value).toBeNull()
    expect(sut.port.getAccessToken()).toBeNull()
    expect(store.getState()).toMatchObject({ status: 'anonymous', session: null })
    expect(clearCache).toHaveBeenCalled()
  })

  it('revokes the tokens when the identity lookup fails', async () => {
    api.login.mockResolvedValue(tokens(1))
    api.fetchUser.mockRejectedValue(new ApiError('down', { kind: 'network' }))
    await expect(sut.signIn('a@b.c', 'x')).rejects.toMatchObject({ kind: 'network' })
    expect(api.logout).toHaveBeenCalledWith('refresh-1')
    expect(storage.value).toBeNull()
  })

  it('does not touch the server logout when the credentials are wrong', async () => {
    api.login.mockRejectedValue(httpError(401))
    await expect(sut.signIn('a@b.c', 'wrong')).rejects.toMatchObject({ status: 401 })
    expect(api.logout).not.toHaveBeenCalled()
    expect(store.getState().status).toBe('anonymous')
  })

  it('still reports the rejection when the server logout fails', async () => {
    api.login.mockResolvedValue(tokens(1))
    api.fetchUser.mockResolvedValue({ ...manager, role: 'EMPLOYEE' })
    api.logout.mockRejectedValue(new ApiError('down', { kind: 'network' }))
    await expect(sut.signIn('a@b.c', 'x')).rejects.toBeInstanceOf(AuthRejectedError)
  })
})

describe('restore (BR-21)', () => {
  it('stays anonymous without a refresh token', async () => {
    await sut.restore()
    expect(api.refresh).not.toHaveBeenCalled()
    expect(store.getState().status).toBe('anonymous')
  })

  it('restores the session from the refresh token and stores the rotated one', async () => {
    setup('refresh-0')
    api.refresh.mockResolvedValue(tokens(1))
    await sut.restore()
    expect(api.refresh).toHaveBeenCalledWith('refresh-0')
    expect(store.getState()).toMatchObject({ status: 'authenticated', session: { accessToken: 'access-1' } })
    expect(storage.value).toBe('refresh-1')
  })

  it('refuses a refresh token that belongs to an employee and revokes it (T-02)', async () => {
    setup('refresh-0')
    api.refresh.mockResolvedValue(tokens(1))
    api.fetchUser.mockResolvedValue({ ...manager, role: 'EMPLOYEE' })
    await sut.restore()
    expect(api.logout).toHaveBeenCalledWith('refresh-1')
    expect(storage.value).toBeNull()
    expect(store.getState()).toMatchObject({ status: 'anonymous', session: null })
    expect(store.getState().notice).toContain('exclusiva para gestores')
  })

  it('drops an expired refresh token without calling logout', async () => {
    setup('refresh-0')
    api.refresh.mockRejectedValue(httpError(401))
    await sut.restore()
    expect(storage.value).toBeNull()
    expect(api.logout).not.toHaveBeenCalled()
    expect(store.getState()).toMatchObject({ status: 'anonymous', notice: 'Sua sessão expirou. Entre novamente.' })
  })

  it('keeps the refresh token when the network is down', async () => {
    setup('refresh-0')
    api.refresh.mockRejectedValue(new ApiError('down', { kind: 'network' }))
    await sut.restore()
    expect(storage.value).toBe('refresh-0')
    expect(store.getState().status).toBe('anonymous')
    expect(store.getState().notice).toContain('restaurar')
  })
})

describe('refreshSession (BR-02, BR-21)', () => {
  beforeEach(async () => { api.login.mockResolvedValue(tokens(1)); await sut.signIn('a@b.c', 'x'); api.fetchUser.mockClear() })

  it('rotates the refresh token on every renewal', async () => {
    api.refresh.mockResolvedValueOnce(tokens(2)).mockResolvedValueOnce(tokens(3))
    expect(await sut.refreshSession()).toBe(true)
    expect(await sut.refreshSession()).toBe(true)
    expect(api.refresh.mock.calls.map((call) => call[0])).toEqual(['refresh-1', 'refresh-2'])
    expect(storage.value).toBe('refresh-3')
    expect(sut.port.getAccessToken()).toBe('access-3')
  })

  it('shares one call between concurrent renewals', async () => {
    let release!: (value: TokenResponse) => void
    api.refresh.mockReturnValue(new Promise<TokenResponse>((resolve) => { release = resolve }))
    const calls = Promise.all([sut.refreshSession(), sut.refreshSession(), sut.port.refresh()])
    release(tokens(2))
    expect(await calls).toEqual([true, true, true])
    expect(api.refresh).toHaveBeenCalledTimes(1)
  })

  it('ends the session when the account stopped being an active manager (T-03)', async () => {
    api.refresh.mockResolvedValue(tokens(2))
    api.fetchUser.mockResolvedValue({ ...manager, role: 'EMPLOYEE' })
    expect(await sut.refreshSession()).toBe(false)
    expect(api.logout).toHaveBeenCalledWith('refresh-2')
    expect(storage.value).toBeNull()
    expect(store.getState()).toMatchObject({ status: 'anonymous', session: null })
    expect(store.getState().notice).toContain('exclusiva para gestores')
  })

  it('keeps the session when the identity cannot be confirmed because of the network', async () => {
    api.refresh.mockResolvedValue(tokens(2))
    api.fetchUser.mockRejectedValue(new ApiError('down', { kind: 'network' }))
    expect(await sut.refreshSession()).toBe(true)
    expect(sut.port.getAccessToken()).toBe('access-2')
    expect(store.getState().session?.user.unitId).toBe('unit-1')
  })

  it('reports failure when the refresh token is refused', async () => {
    api.refresh.mockRejectedValue(httpError(401))
    expect(await sut.refreshSession()).toBe(false)
  })

  it('does not bring the session back when the renewal finishes after signing out', async () => {
    let release!: (value: TokenResponse) => void
    api.refresh.mockReturnValue(new Promise<TokenResponse>((resolve) => { release = resolve }))
    const renewal = sut.refreshSession()
    await sut.signOut('user')
    release(tokens(2))
    expect(await renewal).toBe(false)
    expect(store.getState().status).toBe('anonymous')
    expect(storage.value).toBeNull()
    expect(api.logout.mock.calls.map((call) => call[0])).toEqual(['refresh-1', 'refresh-2'])
  })
})

describe('signOut (BR-20)', () => {
  beforeEach(async () => { api.login.mockResolvedValue(tokens(1)); await sut.signIn('a@b.c', 'x') })

  it('revokes the refresh token on the server and clears storage, cache and hooks', async () => {
    const stop = vi.fn()
    sut.onSignOut(stop)
    await sut.signOut('user')
    expect(api.logout).toHaveBeenCalledWith('refresh-1')
    expect(storage.value).toBeNull()
    expect(clearCache).toHaveBeenCalled()
    expect(stop).toHaveBeenCalledOnce()
    expect(store.getState()).toMatchObject({ status: 'anonymous', session: null, notice: null })
  })

  it('works when the API is down', async () => {
    api.logout.mockRejectedValue(new ApiError('down', { kind: 'network' }))
    await expect(sut.signOut('user')).resolves.toBeUndefined()
    expect(storage.value).toBeNull()
    expect(store.getState().status).toBe('anonymous')
  })

  it('explains an expired session and tells the observers', async () => {
    const expired = vi.fn()
    store.onExpired(expired)
    await sut.signOut('expired')
    expect(store.getState().notice).toBe('Sua sessão expirou. Entre novamente.')
    expect(expired).toHaveBeenCalledOnce()
  })

  it('is idempotent while a logout is in flight', async () => {
    await Promise.all([sut.signOut('user'), sut.signOut('user'), sut.signOut('expired')])
    expect(api.logout).toHaveBeenCalledTimes(1)
  })

  it('is triggered by the HTTP client port when the session is gone', async () => {
    sut.port.onExpired()
    await vi.waitFor(() => expect(store.getState().status).toBe('anonymous'))
    expect(api.logout).toHaveBeenCalledWith('refresh-1')
  })

  it('stops the renewal timer', async () => {
    const timer = timers.at(-1)
    await sut.signOut('user')
    expect(timer?.cleared).toBe(true)
  })

  it('forgets the dismissed notice', async () => {
    await sut.signOut('expired')
    sut.dismissNotice()
    expect(store.getState().notice).toBeNull()
  })
})

describe('scheduled renewal', () => {
  beforeEach(async () => { api.login.mockResolvedValue(tokens(1)); await sut.signIn('a@b.c', 'x') })

  it('schedules the renewal one minute before the access token expires', () => {
    expect(timers.at(-1)?.ms).toBe(3_600_000 - 60_000)
  })

  it('renews when the timer fires and schedules the next one', async () => {
    api.refresh.mockResolvedValue(tokens(2))
    const first = timers.at(-1)!
    first.callback()
    await vi.waitFor(() => expect(sut.port.getAccessToken()).toBe('access-2'))
    expect(timers.at(-1)).not.toBe(first)
    expect(timers.at(-1)?.ms).toBe(3_600_000 - 60_000)
  })

  it('ends the session when the scheduled renewal fails', async () => {
    api.refresh.mockRejectedValue(httpError(401))
    timers.at(-1)!.callback()
    await vi.waitFor(() => expect(store.getState().status).toBe('anonymous'))
    expect(store.getState().notice).toBe('Sua sessão expirou. Entre novamente.')
    expect(api.logout).toHaveBeenCalledWith('refresh-1')
  })
})
