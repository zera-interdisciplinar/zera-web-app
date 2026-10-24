import { http } from '../../../shared/api/http'

/** `POST /auth/password-reset/request`: always 202 for a valid body, whether or not the account exists. */
export async function requestPasswordReset(email: string): Promise<void> {
  await http.request('administrative', '/api/v1/auth/password-reset/request', { method: 'POST', body: { email }, auth: false })
}
