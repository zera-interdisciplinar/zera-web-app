/** Statuses and severities come from the BFF in English codes; an unknown code is shown as received, never hidden. */
const STATUS: Record<string, string> = {
  DRAFT: 'Rascunho', PENDING_APPROVAL: 'Em aprovação', REJECTED: 'Reprovado', IN_STOCK: 'Em estoque', ACTIVE: 'Em estoque',
  IN_USE: 'Emprestado', IN_MAINTENANCE: 'Em manutenção', AWAITING_EVALUATION: 'Aguardando avaliação',
  DISPOSED: 'Descartado', DISCARDED: 'Descartado', REUSED: 'Reuso', REMOVED: 'Removido',
}
const SEVERITY: Record<string, string> = { HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa', CRITICAL: 'Crítica' }

export const statusLabel = (code: string): string => STATUS[code.toUpperCase()] ?? code
export const severityLabel = (code: string): string => SEVERITY[code.toUpperCase()] ?? code

export const PERIOD_LABELS = { '30d': 'últimos 30 dias', '6m': 'últimos 6 meses', '12m': 'últimos 12 meses' } as const
export const VIEW_LABELS = { todos: 'Todos', pendentes: 'Pendentes', categoria: 'Categoria' } as const
