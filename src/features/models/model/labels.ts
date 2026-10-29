import { APPROVAL_STATUSES } from '../../items/schemas/item'

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = { PENDING: 'Pendente', APPROVED: 'Aprovado', REJECTED: 'Rejeitado' }
export const APPROVAL_STATUS_LIST = APPROVAL_STATUSES
