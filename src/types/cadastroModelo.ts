export type CodigoMaterial = 'PLASTIC' | 'METAL' | 'GLASS' | 'PAPER' | 'BATTERY' | 'CIRCUIT_BOARD' | 'CABLE' | 'SCREEN' | 'OTHER'

export interface CadastroModeloReal {
  name: string
  manufacturer: string
  categoryId: string
  materials: CodigoMaterial[]
  notes?: string
  warrantyMonths?: number
  expectedLifespanMonths?: number
  estimatedWeightKg?: number
}

export interface MaterialCatalogo {
  id: string
  code: string
  name: string
  recyclable: boolean
  hazardous: boolean
  disposalGuide: string | null
}
