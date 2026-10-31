import type { EventResponse } from '../types/apiReal'

const STATUS: Record<string, string> = {
  DRAFT: 'Rascunho', PENDING_APPROVAL: 'Em aprovação', REJECTED: 'Rejeitado', IN_STOCK: 'Em estoque',
  IN_MAINTENANCE: 'Em manutenção', AWAITING_EVALUATION: 'Aguardando avaliação', DISPOSED: 'Descartado', REMOVED: 'Removido',
}
const EVENTOS: Record<string, string> = {
  CREATED: 'Item cadastrado', SUBMITTED: 'Enviado para aprovação', APPROVED: 'Aprovado', REJECTED: 'Rejeitado',
  LOAN_STARTED: 'Empréstimo iniciado', LOAN_RETURNED: 'Item devolvido ao estoque', DISPOSAL_CANCELLED: 'Descarte cancelado',
  MAINTENANCE_STARTED: 'Entrou em manutenção', MAINTENANCE_FINISHED: 'Manutenção concluída', EVALUATED: 'Avaliado',
  DISPOSED: 'Descartado', REMOVED: 'Removido do estoque', RESTORED: 'Restaurado',
}
export function rotuloEvento(evento: Pick<EventResponse, 'type' | 'fromStatus' | 'toStatus'>): string {
  if (evento.type === 'STATUS_CHANGED') return `Status alterado de ${STATUS[evento.fromStatus ?? ''] ?? 'não informado'} para ${STATUS[evento.toStatus ?? ''] ?? 'não informado'}`
  return EVENTOS[evento.type] ?? 'Atividade registrada'
}
