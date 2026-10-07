export interface Pagina<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface TokenResponse {
  userId: string
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface UserOutput {
  userId: string
  name: string
  email: string
  role: 'MANAGER' | 'EMPLOYEE'
  status: string
  unitId: string
}

export interface CategoryResponse {
  id: string
  unitId: string
  name: string
  description: string | null
}

export interface ModelResponse {
  id: string
  unitId: string
  name: string
  manufacturer: string
  expectedLifespanMonths: number | null
  warrantyMonths: number | null
  materials: Array<{ id: string; code: string; name: string; recyclable: boolean; hazardous: boolean; disposalGuide: string | null }>
  notes: string | null
  category: CategoryResponse
  approvalStatus: string
}

export interface ItemResponse {
  id: string
  barcode: string
  displayCode: string | null
  name: string | null
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'IN_STOCK' | 'IN_MAINTENANCE' | 'AWAITING_EVALUATION' | 'DISPOSED' | 'REMOVED'
  condition: 'NEW' | 'USED' | 'SEMI_DAMAGED' | 'DAMAGED' | null
  unitId: string
  model: ModelResponse | null
  createdByName: string | null
  createdAt: string
  updatedAt: string
}

export interface HomeSummaryResponse {
  activeItems: number
  activeItemsChangePercent: number
  pendingApproval: number
  inMaintenance: number
  awaitingEvaluation: number
  disposalsInWindow: number
}

export interface DisposalIndicatorsResponse {
  totalWeightKg: number
  recyclingRatePercent: number
  recyclingRateChangePoints: number
  totalWeightChangePercent: number
  monthlyWeightKg: Array<{ month: string; weightKg: number }>
}

export interface EventResponse {
  id: string
  itemId: string
  type: 'CREATED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'MAINTENANCE_STARTED' | 'MAINTENANCE_FINISHED' | 'EVALUATED' | 'DISPOSED' | 'REMOVED' | 'RESTORED' | 'STATUS_CHANGED'
  fromStatus: ItemResponse['status'] | null
  toStatus: ItemResponse['status'] | null
  reason: string | null
  actorId: string | null
  actorName: string | null
  occurredAt: string
}

export interface DisposalResponse {
  id: string
  unitId: string
  destination: 'RECYCLING' | 'LANDFILL' | 'DONATION'
  placeId: string | null
  placeName: string | null
  disposedAt: string
  notes: string | null
  items: Array<{ itemId: string; displayCode: string | null; name: string | null; weightKg: number }>
  totalWeightKg: number
  createdByName: string | null
  createdAt: string
}

export interface UnitSettingsResponse {
  unitId: string
  stockCapacity: number
  configured: boolean
  updatedByName: string | null
  updatedAt: string | null
}

export interface UpdateItemRequest {
  name: string
  condition: NonNullable<ItemResponse['condition']>
  notes: string
}
