import { ApiError } from '../types/api'
import type { EventResponse, UnitSettingsResponse } from '../types/apiReal'
import { ehDataIso, ehNumeroFinito, ehObjeto, ehTexto } from './guardasApi'

const textoNulo = (v: unknown) => v === null || ehTexto(v)
function ehEvento(valor: unknown): valor is EventResponse {
  return ehObjeto(valor) && ehTexto(valor.id) && Boolean(valor.id.trim())
    && ehTexto(valor.itemId) && Boolean(valor.itemId.trim()) && ehTexto(valor.type) && Boolean(valor.type.trim())
    && textoNulo(valor.fromStatus) && textoNulo(valor.toStatus) && textoNulo(valor.reason)
    && textoNulo(valor.actorId) && textoNulo(valor.actorName) && ehDataIso(valor.occurredAt)
}
export function lerEventoApi(valor: unknown): EventResponse {
  if (!ehObjeto(valor)) throw new ApiError('Não conseguimos ler o evento. Tente novamente.', 0)
  const normalizado = { ...valor, fromStatus: valor.fromStatus ?? null, toStatus: valor.toStatus ?? null,
    reason: valor.reason ?? null, actorId: valor.actorId ?? null, actorName: valor.actorName ?? null }
  if (!ehEvento(normalizado)) throw new ApiError('Não conseguimos ler o evento. Tente novamente.', 0)
  return normalizado
}
function ehCapacidade(valor: unknown): valor is UnitSettingsResponse {
  return ehObjeto(valor) && ehTexto(valor.unitId) && Boolean(valor.unitId.trim())
    && (valor.stockCapacity === null || (ehNumeroFinito(valor.stockCapacity) && Number.isInteger(valor.stockCapacity) && valor.stockCapacity >= 0))
    && typeof valor.configured === 'boolean' && textoNulo(valor.updatedByName)
    && (valor.updatedAt === null || ehDataIso(valor.updatedAt))
}
export function lerCapacidadeApi(valor: unknown): UnitSettingsResponse {
  if (!ehObjeto(valor)) throw new ApiError('Não conseguimos ler a capacidade. Tente novamente.', 0)
  const normalizado = { ...valor, stockCapacity: valor.stockCapacity ?? null, updatedByName: valor.updatedByName ?? null, updatedAt: valor.updatedAt ?? null }
  if (!ehCapacidade(normalizado)) throw new ApiError('Não conseguimos ler a capacidade. Tente novamente.', 0)
  return normalizado
}
