import type { UnitSettings } from '../types/settings'
import { toApiError } from '../utils/apiError'
import { unitSettingsSchema } from '../utils/settingsValidation'
import { http } from './http'

export async function getUnitSettings(signal?: AbortSignal): Promise<UnitSettings> {
  try {
    return await http.request('inventory', '/api/v1/unit-settings', { schema: unitSettingsSchema, signal })
  } catch (error) {
    throw toApiError(error)
  }
}

export async function saveUnitSettings(stockCapacity: number): Promise<UnitSettings> {
  try {
    return await http.request('inventory', '/api/v1/unit-settings', { method: 'PUT', body: { stockCapacity }, schema: unitSettingsSchema })
  } catch (error) {
    throw toApiError(error)
  }
}
