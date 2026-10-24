import { bindSession, http } from '../api/http'
import { queryClient } from '../api/queryClient'
import { createAuthApi } from './authApi'
import { refreshTokenStorage } from './refreshTokenStorage'
import { createSessionManager } from './sessionManager'
import { createSessionStore } from './sessionStore'
import { createUseSession } from './useSession'

export const sessionStore = createSessionStore({
  status: refreshTokenStorage.read() ? 'restoring' : 'anonymous',
  session: null,
  notice: null,
})

export const sessionManager = createSessionManager({
  api: createAuthApi(http),
  store: sessionStore,
  storage: refreshTokenStorage,
  clearCache: () => queryClient.clear(),
})

bindSession(sessionManager.port)

export const useSession = createUseSession(sessionStore)

export { AuthRejectedError, rejectionMessage } from './gate'
export type { SessionUser } from './gate'
export type { Session, SessionState, SessionStatus } from './sessionStore'
