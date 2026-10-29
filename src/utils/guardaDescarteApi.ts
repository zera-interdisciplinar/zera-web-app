import { ApiError } from '../types/api'
import type { DisposalResponse } from '../types/apiReal'
import type { LocalReciclagem } from '../types/descarte'
import { ehObjeto, ehTexto, ehNumeroFinito, ehDataIso, lerLista } from './guardasApi'
const textoNulo = (valor: unknown) => valor === null || ehTexto(valor)
const peso = (valor: unknown) => ehNumeroFinito(valor) && valor >= 0
function ehItemDescarte(valor: unknown): valor is DisposalResponse['items'][number] {
  return ehObjeto(valor) && ehTexto(valor.itemId) && valor.itemId.length > 0 && textoNulo(valor.displayCode) && textoNulo(valor.name) && (valor.weightKg === null || peso(valor.weightKg))
}
export function ehDescarteApi(valor: unknown): valor is DisposalResponse {
  if (!ehObjeto(valor) || !ehTexto(valor.id) || !valor.id || !ehTexto(valor.unitId) || !valor.unitId
    || !ehTexto(valor.destination) || !textoNulo(valor.placeId) || !textoNulo(valor.placeName)
    || !ehDataIso(valor.disposedAt) || !ehDataIso(valor.createdAt) || !textoNulo(valor.notes)
    || !textoNulo(valor.createdByName) || !peso(valor.totalWeightKg)) return false
  try { lerLista(valor.items, ehItemDescarte); return true } catch { return false }
}
function ehHorario(valor: unknown): valor is LocalReciclagem['openingHours'][number] {
  return ehObjeto(valor) && ehTexto(valor.days) && ehTexto(valor.hours)
}
export function ehLocalApi(valor: unknown): valor is LocalReciclagem {
  if (!ehObjeto(valor) || !ehTexto(valor.placeId) || !valor.placeId || !ehTexto(valor.name) || !ehTexto(valor.address)
    || !ehNumeroFinito(valor.lat) || valor.lat < -90 || valor.lat > 90
    || !ehNumeroFinito(valor.lng) || valor.lng < -180 || valor.lng > 180
    || !peso(valor.distanceMeters) || !(valor.isOpen === null || typeof valor.isOpen === 'boolean') || !textoNulo(valor.description)) return false
  try { lerLista(valor.openingHours, ehHorario); return true } catch { return false }
}
export function lerDescarteApi(valor: unknown): DisposalResponse {
  if (!ehDescarteApi(valor)) throw new ApiError('Não conseguimos confirmar os dados do descarte. Tente novamente.', 0)
  return valor
}
