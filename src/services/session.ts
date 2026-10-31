import { queryClient } from '../utils/queryClient'
import { authApi } from './auth'
import { bindSession } from './http'
import { refreshTokenStorage } from './refreshTokenStorage'
import { createSessionManager } from './sessionManager'
import { createSessionStore } from './sessionStore'

/** The one session of the running application: state, rules and the port the HTTP client uses. */
export const sessionStore = createSessionStore({
  status: refreshTokenStorage.read() ? 'restoring' : 'anonymous',
  session: null,
  notice: null,
})

export const sessionManager = createSessionManager({
  api: authApi,
  store: sessionStore,
  storage: refreshTokenStorage,
  clearCache: () => queryClient.clear(),
})

bindSession(sessionManager.port)
