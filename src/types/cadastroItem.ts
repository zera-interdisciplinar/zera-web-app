export type CondicaoItemReal = 'NEW' | 'USED' | 'SEMI_DAMAGED' | 'DAMAGED'
export type DanoItemReal = 'BROKEN_SCREEN' | 'MISSING_PART' | 'DOES_NOT_POWER_ON' | 'OXIDATION' | 'OTHER'

export interface CadastroItemReal {
  name: string
  barcode: string
  modelId: string
  condition: CondicaoItemReal
  usageIntensity: number
  hasDamages: boolean
  damages?: DanoItemReal[]
}

export type CadastroItemEntrada = Omit<CadastroItemReal, 'hasDamages'> & { hasDamages: boolean | null }
