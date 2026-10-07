export type CondicaoItemReal = 'NEW' | 'USED' | 'SEMI_DAMAGED' | 'DAMAGED'

export interface CadastroItemReal {
  name: string
  barcode: string
  modelId: string
  condition: CondicaoItemReal
}
