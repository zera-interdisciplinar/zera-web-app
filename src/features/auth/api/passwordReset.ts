import { http } from '../../../shared/api/http'

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
