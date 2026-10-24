import type { HttpClient } from '../api/httpClient'
import { tokenResponseSchema, userOutputSchema, type TokenResponse, type UserOutput } from './schemas'

const LOGOUT_TIMEOUT_MS = 5_000

/** Calls to the identity service (ms-administrative-core). Every route here is allowlisted in the proxy. */
export function createAuthApi(http: Pick<HttpClient, 'request'>) {
  return {
    login(email: string, password: string): Promise<TokenResponse> {
      return http.request('administrative', '/api/v1/auth/login', { method: 'POST', body: { email, password }, auth: false, schema: tokenResponseSchema })
    },
    refresh(refreshToken: string): Promise<TokenResponse> {
      return http.request('administrative', '/api/v1/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false, schema: tokenResponseSchema })
    },
    /** Revokes the refresh token on the server (BR-20). */
    async logout(refreshToken: string): Promise<void> {
      await http.request('administrative', '/api/v1/auth/logout', { method: 'POST', body: { refreshToken }, auth: false, timeoutMs: LOGOUT_TIMEOUT_MS })
    },
    fetchUser(userId: string, accessToken: string): Promise<UserOutput> {
      return http.request('administrative', `/api/v1/users/${encodeURIComponent(userId)}`, { accessToken, schema: userOutputSchema })
    },
  }
}

export type AuthApi = ReturnType<typeof createAuthApi>
