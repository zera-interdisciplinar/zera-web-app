import type { RefreshTokenStorage } from './sessionManager'

const KEY = 'zera.session.refresh'

/** `sessionStorage` is scoped to the tab; every access is guarded because it can throw (private mode, blocked data). */
export const refreshTokenStorage: RefreshTokenStorage = {
  read() {
    try { return window.sessionStorage.getItem(KEY) } catch { return null }
  },
  write(token) {
    try { window.sessionStorage.setItem(KEY, token) } catch { /* the session just will not survive a reload */ }
  },
  clear() {
    try { window.sessionStorage.removeItem(KEY) } catch { /* nothing to clear */ }
  },
}
