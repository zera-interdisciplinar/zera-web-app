import { requestPasswordReset } from '../services/auth'

/** The password reset request as a hook, so the dialog does not import a service (BR-19: it never fails). */
export function usePasswordReset(): (email: string) => Promise<void> {
  return requestPasswordReset
}
