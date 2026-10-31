import { ApiError } from './apiError'
import { AuthRejectedError } from './managerGate'
import type { LoginFailure } from '../types/auth'

export function describeLoginError(error: unknown): LoginFailure {
  if (error instanceof AuthRejectedError) return { message: error.message, countsAsAttempt: false }
  if (error instanceof ApiError) {
    if (error.kind === 'http' && [400, 401, 403].includes(error.status)) return { message: 'E-mail ou senha inválidos.', countsAsAttempt: true }
    if (error.kind === 'network' || error.kind === 'timeout' || (error.kind === 'http' && error.status >= 500)) {
      return { message: 'Servidor de autenticação indisponível. Tente novamente mais tarde.', countsAsAttempt: false }
    }
    if (error.kind === 'config') return { message: 'Serviço de autenticação não configurado.', countsAsAttempt: false }
    if (error.kind === 'contract') return { message: 'Resposta inválida do serviço de autenticação.', countsAsAttempt: false }
  }
  return { message: 'Não foi possível concluir o login.', countsAsAttempt: false }
}

/** Only same-origin paths: a crafted `state.from` must never become an open redirect. */
export function safeRedirect(state: unknown): string {
  if (!state || typeof state !== 'object' || !('from' in state) || typeof state.from !== 'string') return '/'
  const target = state.from
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return '/'
  return target
}
