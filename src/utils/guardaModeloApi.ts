import type { ModelResponse } from '../types/apiReal'
import type { MaterialCatalogo } from '../types/cadastroModelo'
import { ehCategoriaApi, normalizarCategoriaApi } from './guardaCategoriaApi'
import { ehObjeto, ehTexto, ehNumeroFinito, lerLista } from './guardasApi'
import { ApiError } from '../types/api'

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

export function normalizarMaterialApi(valor: unknown): unknown {
  return ehObjeto(valor) ? { ...valor, disposalGuide: valor.disposalGuide ?? null } : valor
}

export function lerMaterialApi(valor: unknown): MaterialCatalogo {
  const normalizado = normalizarMaterialApi(valor)
  if (!ehMaterialApi(normalizado)) throw new ApiError('Não conseguimos ler o material. Tente novamente.', 0)
  return normalizado
}

export function normalizarModeloApi(valor: unknown): unknown {
  if (!ehObjeto(valor)) return valor
  return { ...valor, expectedLifespanMonths: valor.expectedLifespanMonths ?? null,
    warrantyMonths: valor.warrantyMonths ?? null, estimatedWeightKg: valor.estimatedWeightKg ?? null,
    notes: valor.notes ?? null, category: normalizarCategoriaApi(valor.category),
    materials: Array.isArray(valor.materials) ? valor.materials.map(normalizarMaterialApi) : valor.materials }
}

export function lerModeloApi(valor: unknown): ModelResponse {
  const normalizado = normalizarModeloApi(valor)
  if (!ehModeloApi(normalizado)) throw new ApiError('Não conseguimos ler o modelo. Tente novamente.', 0)
  return normalizado
}

export function ehCodigoMaterial(valor: string): valor is import('../types/cadastroModelo').CodigoMaterial {
  return valor === 'PLASTIC' || valor === 'METAL' || valor === 'GLASS' || valor === 'PAPER' || valor === 'BATTERY' || valor === 'CIRCUIT_BOARD' || valor === 'CABLE' || valor === 'SCREEN' || valor === 'OTHER'
}
