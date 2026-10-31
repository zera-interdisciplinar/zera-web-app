import { APPROVAL_STATUSES } from './itemSchemas'
import type { ApprovalStatus } from '../types/model'

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = { PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Rejeitado' }
export const APPROVAL_STATUS_LIST = APPROVAL_STATUSES
