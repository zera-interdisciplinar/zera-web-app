import type { z } from 'zod'
import type { tokenResponseSchema, userOutputSchema } from '../utils/authSchemas'
import type { createSessionManager } from '../services/sessionManager'
import type { createSessionStore } from '../services/sessionStore'
import type { loginSchema } from '../utils/loginValidation'

export type TokenResponse = z.infer<typeof tokenResponseSchema>

export type UserOutput = z.infer<typeof userOutputSchema>

export interface SessionUser {
  id: string
  name: string
  email: string
  role: 'MANAGER'
  unitId: string
}

export type RejectionReason = 'not-manager' | 'inactive' | 'no-unit' | 'identity-mismatch'

export type SessionStatus = 'restoring' | 'anonymous' | 'authenticated'

export interface Session {
  accessToken: string
  refreshToken: string
  /** Epoch milliseconds at which the access token expires. */
  expiresAt: number
  user: SessionUser
}

export interface SessionState {
  status: SessionStatus
  session: Session | null
  /** Why the user is back at the login screen (expired session, rejected role...). */
  notice: string | null
}

export type SessionStore = ReturnType<typeof createSessionStore>

export interface RefreshTokenStorage {
  read(): string | null
  write(token: string): void
  clear(): void
}

export type SignOutReason = 'user' | 'expired' | 'rejected'

export interface SessionManagerDeps {
  api: AuthApi
  store: SessionStore
  storage: RefreshTokenStorage
  /** Clears cached server data (TanStack Query). */
  clearCache: () => void
  now?: () => number
  setTimer?: (callback: () => void, ms: number) => unknown
  clearTimer?: (handle: unknown) => void
  /** Renew this long before the access token expires. */
  renewAheadMs?: number
}

export type SessionManager = ReturnType<typeof createSessionManager>

export interface AuthApi {
  login(email: string, password: string): Promise<TokenResponse>
  refresh(refreshToken: string): Promise<TokenResponse>
  /** Revokes the refresh token on the server (BR-20). */
  logout(refreshToken: string): Promise<void>
  fetchUser(userId: string, accessToken: string): Promise<UserOutput>
}

export interface LoginFailure {
  message: string
  /** Wrong credentials count towards the short cooldown after repeated failures. */
  countsAsAttempt: boolean
}

export type LoginInput = z.input<typeof loginSchema>

export type FieldErrors<Field extends string> = Partial<Record<Field, string>>
