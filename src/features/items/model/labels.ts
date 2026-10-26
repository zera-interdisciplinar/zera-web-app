import type { DamageType, ItemCondition, ItemStatus, MaterialCode } from '../schemas/item'

export const STATUS_LABEL: Record<ItemStatus, string> = {
  DRAFT: 'Rascunho', PENDING_APPROVAL: 'Em aprovação', REJECTED: 'Reprovado', IN_STOCK: 'Em estoque', IN_USE: 'Emprestado',
  IN_MAINTENANCE: 'Em manutenção', AWAITING_EVALUATION: 'Aguardando avaliação', DISPOSED: 'Descartado', REMOVED: 'Removido',
}
export const CONDITION_LABEL: Record<ItemCondition, string> = { NEW: 'Novo', USED: 'Usado', SEMI_DAMAGED: 'Semidanificado', DAMAGED: 'Danificado' }
export const DAMAGE_LABEL: Record<DamageType, string> = { BROKEN_SCREEN: 'Tela quebrada', MISSING_PART: 'Peça faltando', DOES_NOT_POWER_ON: 'Não liga', OXIDATION: 'Oxidação', OTHER: 'Outro' }
export const MATERIAL_LABEL: Record<MaterialCode, string> = { PLASTIC: 'Plástico', METAL: 'Metal', GLASS: 'Vidro', PAPER: 'Papel', BATTERY: 'Bateria', CIRCUIT_BOARD: 'Placa de circuito', CABLE: 'Cabo', SCREEN: 'Tela', OTHER: 'Outro' }

export type StatusTone = 'amber' | 'green' | 'blue' | 'gray' | 'neutral'
export const STATUS_TONE: Record<ItemStatus, StatusTone> = {
  DRAFT: 'gray', PENDING_APPROVAL: 'amber', REJECTED: 'gray', IN_STOCK: 'green', IN_USE: 'blue',
  IN_MAINTENANCE: 'blue', AWAITING_EVALUATION: 'blue', DISPOSED: 'neutral', REMOVED: 'gray',
}

export const EVENT_LABEL: Record<string, string> = {
  CREATED: 'Item cadastrado', SUBMITTED: 'Enviado para aprovação', APPROVED: 'Aprovado', REJECTED: 'Reprovado',
  MAINTENANCE_STARTED: 'Entrou em manutenção', MAINTENANCE_FINISHED: 'Manutenção concluída', EVALUATED: 'Avaliado',
  LOAN_STARTED: 'Empréstimo iniciado', LOAN_RETURNED: 'Item devolvido ao estoque', DISPOSED: 'Descartado',
  DISPOSAL_CANCELLED: 'Descarte cancelado', REMOVED: 'Removido do estoque', RESTORED: 'Restaurado',
}

/** Names the server uses in `missingFields` and in field errors, as the manager knows them. */
export const FIELD_LABEL: Record<string, string> = {
  name: 'Nome', condition: 'Condição', hasDamages: 'Possui danos', damages: 'Tipos de dano', usageIntensity: 'Intensidade de uso',
  model: 'Modelo', modelId: 'Modelo', barcode: 'Código de barras', serialNumber: 'Número de série', acquiredAt: 'Data de aquisição',
  manufacturingYear: 'Ano de fabricação', notes: 'Observações',
}
export const fieldLabel = (field: string) => FIELD_LABEL[field] ?? field
