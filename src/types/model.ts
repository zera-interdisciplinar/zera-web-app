import type { APPROVAL_STATUSES } from '../utils/itemSchemas'
import type { MaterialCode } from './item'
import type { z } from 'zod'
import type { categoryFormSchema, modelFormSchema } from '../utils/modelValidation'

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export type ModelPatch =
  | { field: 'name'; value: string }
  | { field: 'manufacturer'; value: string }
  | { field: 'warrantyMonths'; value: number }
  | { field: 'expectedLifespanMonths'; value: number }
  | { field: 'materials'; value: ModelFormValues['materials'] }

export interface ListModelsParams {
  page: number
  size: number
  approvalStatus?: ApprovalStatus
}

export interface CreateModelRequest {
  name: string
  manufacturer: string
  categoryId: string
  materials: MaterialCode[]
  estimatedWeightKg?: number
  warrantyMonths?: number
  expectedLifespanMonths?: number
  notes?: string
}

export type CategoryFormInput = z.input<typeof categoryFormSchema>

export type CategoryFormValues = z.output<typeof categoryFormSchema>

export type ModelFormInput = z.input<typeof modelFormSchema>

export type ModelFormValues = z.output<typeof modelFormSchema>
