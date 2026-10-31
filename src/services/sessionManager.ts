import { ApiError } from '../utils/apiError'


import { assertManager, AuthRejectedError, rejectionMessage } from '../utils/managerGate'
import type { SessionPort } from '../types/http'
import type { SessionUser, TokenResponse } from '../types/auth'
import type { SessionManagerDeps, SignOutReason } from '../types/auth'



const EXPIRED_NOTICE = 'Sua sessão expirou. Entre novamente.'
const MAX_TIMER_MS = 2_147_483_647

export function createSessionManager(deps: SessionManagerDeps) {
  const { api, store, storage } = deps
  const now = deps.now ?? (() => Date.now())
  const setTimer = deps.setTimer ?? ((callback, ms) => setTimeout(callback, ms))
  const clearTimer = deps.clearTimer ?? ((handle) => clearTimeout(handle as ReturnType<typeof setTimeout>))
  const renewAheadMs = deps.renewAheadMs ?? 60_000
  const teardownHooks = new Set<() => void>()
  let timer: unknown
  let refreshing: Promise<boolean> | null = null
  let signingOut: Promise<void> | null = null

  const currentSession = () => store.getState().session

  function schedule(expiresAt: number): void {
    if (timer !== undefined) clearTimer(timer)
    const delay = Math.min(Math.max(expiresAt - now() - renewAheadMs, 0), MAX_TIMER_MS)
    timer = setTimer(() => {
      timer = undefined
      void refreshSession().then((renewed) => { if (!renewed) return signOut('expired') })
    }, delay)
  }

  function stopTimer(): void {
    if (timer !== undefined) clearTimer(timer)
    timer = undefined
  }

  async function revokeOnServer(refreshToken: string | undefined): Promise<void> {
    if (!refreshToken) return
    try {
      await api.logout(refreshToken)
    } catch {
      // Best effort: the local session is already gone and the token expires on its own.
    }
  }

  function commit(tokens: TokenResponse, user: SessionUser): void {
    const expiresAt = now() + tokens.expiresIn * 1000
    storage.write(tokens.refreshToken)
    store.setState({ status: 'authenticated', notice: null, session: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, expiresAt, user } })
    schedule(expiresAt)
  }

  async function validate(tokens: TokenResponse): Promise<SessionUser> {
    return assertManager(await api.fetchUser(tokens.userId, tokens.accessToken), tokens)
  }

  /** Ends the session locally at once and revokes the refresh token on the server (BR-20). */
  function signOut(reason: SignOutReason, notice?: string): Promise<void> {
    if (signingOut) return signingOut
    const refreshToken = currentSession()?.refreshToken ?? storage.read() ?? undefined
    stopTimer()
    storage.clear()
    deps.clearCache()
    teardownHooks.forEach((hook) => hook())
    store.setState({ status: 'anonymous', session: null, notice: notice ?? (reason === 'expired' ? EXPIRED_NOTICE : null) })
    if (reason === 'expired') store.notifyExpired()
    signingOut = revokeOnServer(refreshToken).finally(() => { signingOut = null })
    return signingOut
  }

  /** Rejected role or inactive account: revoke the tokens we just obtained and explain why. */
  async function reject(tokens: TokenResponse, error: unknown): Promise<never> {
    stopTimer()
    storage.clear()
    deps.clearCache()
    store.setState({ status: 'anonymous', session: null, notice: error instanceof AuthRejectedError ? rejectionMessage(error.reason) : null })
    await revokeOnServer(tokens.refreshToken)
    throw error
  }

  /** Logs in and applies the manager-only gate. Throws `AuthRejectedError` or `ApiError`. */
  async function signIn(email: string, password: string): Promise<SessionUser> {
    stopTimer()
    const tokens = await api.login(email, password)
    let user: SessionUser
    try {
      user = await validate(tokens)
    } catch (error) {
      return reject(tokens, error)
    }
    commit(tokens, user)
    return user
  }

  /** Called once at startup: restores the session from the refresh token kept in the tab. */
  async function restore(): Promise<void> {
    const refreshToken = storage.read()
    if (!refreshToken) { store.setState({ status: 'anonymous', session: null, notice: null }); return }
    store.setState({ status: 'restoring', session: null, notice: null })
    let tokens: TokenResponse
    try {
      tokens = await api.refresh(refreshToken)
    } catch (error) {
      const definitive = error instanceof ApiError && [400, 401, 403].includes(error.status)
      if (definitive) storage.clear()
      store.setState({ status: 'anonymous', session: null, notice: definitive ? EXPIRED_NOTICE : 'Não foi possível restaurar a sessão. Entre novamente.' })
      return
    }
    try {
      commit(tokens, await validate(tokens))
    } catch (error) {
      if (error instanceof AuthRejectedError) await reject(tokens, error).catch(() => undefined)
      else {
        await revokeOnServer(tokens.refreshToken)
        storage.clear()
        store.setState({ status: 'anonymous', session: null, notice: 'Não foi possível restaurar a sessão. Entre novamente.' })
      }
    }
  }

  /**
   * Renews the tokens. The backend rotates the refresh token, so concurrent callers share one call.
   * The role and status are checked again: a demoted account must not keep a manager session (BR-02).
   */
  function refreshSession(): Promise<boolean> {
    refreshing ??= (async () => {
      const before = currentSession()
      if (!before) return false
      let tokens: TokenResponse
      try {
        tokens = await api.refresh(before.refreshToken)
      } catch {
        return false
      }
      if (currentSession()?.refreshToken !== before.refreshToken) {
        // The user signed out (or signed in again) while the call was in flight: revoke the orphan tokens.
        await revokeOnServer(tokens.refreshToken)
        return false
      }
      try {
        commit(tokens, await validate(tokens))
        return true
      } catch (error) {
        if (error instanceof AuthRejectedError) {
          await reject(tokens, error).catch(() => undefined)
          return false
        }
        // Could not confirm the user (network): keep the new tokens and the previous identity.
        commit(tokens, before.user)
        return true
      }
    })().finally(() => { refreshing = null })
    return refreshing
  }

  const port: SessionPort = {
    getAccessToken: () => currentSession()?.accessToken ?? null,
    getUnitId: () => currentSession()?.user.unitId ?? null,
    refresh: refreshSession,
    onExpired: () => { void signOut('expired') },
  }

  return {
    port,
    signIn,
    signOut,
    restore,
    refreshSession,
    /** Registers something to stop when the session ends (for example, the dashboard stream). */
    dismissNotice(): void {
      if (store.getState().notice !== null) store.setState({ ...store.getState(), notice: null })
    },
    onSignOut(hook: () => void): () => void {
      teardownHooks.add(hook)
      return () => { teardownHooks.delete(hook) }
    },
  }
}
