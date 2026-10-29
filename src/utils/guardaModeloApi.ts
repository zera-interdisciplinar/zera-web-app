import type { ModelResponse } from '../types/apiReal'
import type { MaterialCatalogo } from '../types/cadastroModelo'
import { ehCategoriaApi } from './guardaCategoriaApi'
import { ehObjeto, ehTexto, ehNumeroFinito, lerLista } from './guardasApi'

export function ehMaterialApi(valor: unknown): valor is MaterialCatalogo {
  return ehObjeto(valor) && ehTexto(valor.id) && valor.id.trim().length > 0
    && ehTexto(valor.code)
    && ehTexto(valor.name) && valor.name.trim().length > 0
    && typeof valor.recyclable === 'boolean' && typeof valor.hazardous === 'boolean'
    && (valor.disposalGuide === null || ehTexto(valor.disposalGuide))
}
const meses = (valor: unknown) => valor === null || (ehNumeroFinito(valor) && Number.isInteger(valor) && valor >= 0)
export function ehModeloApi(valor: unknown): valor is ModelResponse {
  if (!ehObjeto(valor)) return false
  if (!ehTexto(valor.id) || !valor.id.trim() || !ehTexto(valor.unitId) || !valor.unitId.trim()
    || !ehTexto(valor.name) || !valor.name.trim() || !ehTexto(valor.manufacturer)
    || !meses(valor.expectedLifespanMonths) || !meses(valor.warrantyMonths)
    || !(valor.estimatedWeightKg === undefined || valor.estimatedWeightKg === null || (ehNumeroFinito(valor.estimatedWeightKg) && valor.estimatedWeightKg >= 0))
    || !(valor.notes === null || ehTexto(valor.notes)) || !ehCategoriaApi(valor.category) || !ehTexto(valor.approvalStatus)) return false
  try { lerLista(valor.materials, ehMaterialApi); return true } catch { return false }
}

export function ehCodigoMaterial(valor: string): valor is import('../types/cadastroModelo').CodigoMaterial {
  return valor === 'PLASTIC' || valor === 'METAL' || valor === 'GLASS' || valor === 'PAPER' || valor === 'BATTERY' || valor === 'CIRCUIT_BOARD' || valor === 'CABLE' || valor === 'SCREEN' || valor === 'OTHER'
}
