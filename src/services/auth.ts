import type { AuthApi, TokenResponse, UserOutput } from '../types/auth'
import { toApiError } from '../utils/apiError'
import { tokenResponseSchema, userOutputSchema } from '../utils/authSchemas'
import { http } from './http'

const LOGOUT_TIMEOUT_MS = 5_000

/** Calls to the identity service (ms-administrative-core). Every route here is allowlisted in the proxy. */
export async function login(email: string, password: string): Promise<TokenResponse> {
  try {
    return await http.request('administrative', '/api/v1/auth/login', { method: 'POST', body: { email, password }, auth: false, schema: tokenResponseSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function refresh(refreshToken: string): Promise<TokenResponse> {
  try {
    return await http.request('administrative', '/api/v1/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false, schema: tokenResponseSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

/** Revokes the refresh token on the server (BR-20). */
export async function logout(refreshToken: string): Promise<void> {
  try {
    await http.request('administrative', '/api/v1/auth/logout', { method: 'POST', body: { refreshToken }, auth: false, timeoutMs: LOGOUT_TIMEOUT_MS })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function fetchUser(userId: string, accessToken: string): Promise<UserOutput> {
  try {
    return await http.request('administrative', `/api/v1/users/${encodeURIComponent(userId)}`, { accessToken, schema: userOutputSchema })
  } catch (error) {
    throw toApiError(error)
  }
}

/**
 * `POST /auth/password-reset/request`: always 202 for a valid body, whether or not the account exists.
 * Failures are swallowed on purpose: the answer is the same whatever happens, so the form cannot be used to
 * probe which accounts exist (BR-19).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    await http.request('administrative', '/api/v1/auth/password-reset/request', { method: 'POST', body: { email }, auth: false })
  } catch {
    // Intentionally ignored (BR-19).
  }
}

/** The calls the session manager needs, as one object so it can be replaced in tests. */
export const authApi: AuthApi = { login, refresh, logout, fetchUser }
