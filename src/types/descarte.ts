export interface NovoDescarte {
  destination: 'RECYCLING' | 'LANDFILL' | 'DONATION'
  placeId?: string
  placeName?: string
  disposedAt?: string
  notes?: string
  itemIds: string[]
}

export interface BuscaLocaisReciclagem {
  lat: number
  lng: number
  radiusMeters?: number
}

export interface LocalReciclagem {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
  distanceMeters: number
  isOpen: boolean | null
  description: string | null
  openingHours: Array<{ days: string; hours: string }>
}
