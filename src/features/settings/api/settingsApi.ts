import { http } from '../../../shared/api/http'
import { unitSettingsSchema } from '../schemas/settings'

export const settingsApi = {
  get: (signal?: AbortSignal) => http.request('inventory', '/api/v1/unit-settings', { schema: unitSettingsSchema, signal }),
  save: (stockCapacity: number) => http.request('inventory', '/api/v1/unit-settings', { method: 'PUT', body: { stockCapacity }, schema: unitSettingsSchema }),
}
