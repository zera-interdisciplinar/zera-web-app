import type { TokenResponse, UserOutput } from '../types/auth'
import type { RejectionReason, SessionUser } from '../types/auth'


/** The web is for managers only: any other outcome ends the session (BR-01, BR-02). */
export class AuthRejectedError extends Error {
  readonly reason: RejectionReason
  constructor(reason: RejectionReason) {
    super(rejectionMessage(reason))
    this.name = 'AuthRejectedError'
    this.reason = reason
  }
}

export function rejectionMessage(reason: RejectionReason): string {
  switch (reason) {
    case 'not-manager': return 'Esta área é exclusiva para gestores. Use o app Zera.'
    case 'inactive': return 'Conta inativa. Procure o responsável pela sua unidade.'
    case 'no-unit': return 'A conta não possui unidade de inventário.'
    case 'identity-mismatch': return 'Não foi possível confirmar a identidade da conta. Tente novamente.'
  }
}

/** Throws unless the user is an active manager with a unit, and is the owner of the tokens. */
export function assertManager(user: UserOutput, tokens: Pick<TokenResponse, 'userId'>): SessionUser {
  if (user.userId !== tokens.userId) throw new AuthRejectedError('identity-mismatch')
  if (user.role !== 'MANAGER') throw new AuthRejectedError('not-manager')
  if (user.status !== 'ACTIVE') throw new AuthRejectedError('inactive')
  if (!user.unitId) throw new AuthRejectedError('no-unit')
  return { id: user.userId, name: user.name, email: user.email, role: 'MANAGER', unitId: user.unitId }
}
