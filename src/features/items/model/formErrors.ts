import { ApiError, describeApiError } from '../../../shared/api/errors'
import { fieldLabel } from './labels'

export interface FormFailure {
  /** Errors to show next to a field, keyed by the form path (for example `barcode` or `model.name`). */
  fields: Record<string, string>
  /** Shown above the form when nothing could be tied to a field. */
  general?: string
}

/** Server field names that exist in the item form, mapped to the form path. */
const FIELD_PATHS: Record<string, string> = {
  barcode: 'barcode', name: 'name', condition: 'condition', hasDamages: 'hasDamages', damages: 'damages', usageIntensity: 'usageIntensity',
  serialNumber: 'serialNumber', acquiredAt: 'acquiredAt', manufacturingYear: 'manufacturingYear', notes: 'notes', modelId: 'modelId',
  'model.name': 'model.name', 'model.manufacturer': 'model.manufacturer', 'model.categoryId': 'model.categoryId',
  'model.materials': 'model.materials', 'model.estimatedWeightKg': 'model.estimatedWeightKg',
}

/**
 * Turns an API failure into form feedback. On create, a 409 can only be the duplicate barcode (BR-11);
 * on edit it means the item changed under the manager's feet.
 */
export function toFormFailure(error: unknown, mode: 'create' | 'edit'): FormFailure {
  if (error instanceof ApiError && error.status === 409) {
    return mode === 'create'
      ? { fields: { barcode: 'Já existe um item com este código de barras.' } }
      : { fields: {}, general: 'O item mudou desde a última leitura. Feche e abra novamente para ver os dados atuais.' }
  }
  if (error instanceof ApiError && error.status === 422 && error.missingFields.length > 0) {
    return { fields: {}, general: `Faltam dados para concluir o cadastro: ${error.missingFields.map(fieldLabel).join(', ')}.` }
  }
  if (error instanceof ApiError && error.status === 400) {
    const fields: Record<string, string> = {}
    // The server's wording is in English and may expose internals: only the field is trusted.
    for (const name of Object.keys(error.fieldErrors)) {
      const path = FIELD_PATHS[name]
      if (path) fields[path] = 'Valor inválido. Revise este campo.'
    }
    if (Object.keys(fields).length > 0) return { fields }
  }
  return { fields: {}, general: describeApiError(error) }
}
