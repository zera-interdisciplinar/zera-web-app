const rotulos: Record<string, string> = {
  PENDING_APPROVAL: 'Aguardando aprovação', DRAFT: 'Rascunho', REJECTED: 'Rejeitado', IN_STOCK: 'Em estoque',
  ACTIVE: 'Em estoque', IN_MAINTENANCE: 'Em manutenção', AWAITING_EVALUATION: 'Aguardando avaliação',
  DISPOSED: 'Descartado', DISCARDED: 'Descartado', REMOVED: 'Removido', REUSED: 'Reuso',
  HIGH: 'Alta', MEDIUM: 'Média', LOW: 'Baixa', CRITICAL: 'Crítica', high: 'Alta', medium: 'Média', low: 'Baixa', critical: 'Crítica',
}

export function rotuloDashboard(valor: string): string {
  return rotulos[valor] ?? 'Não informado'
}
