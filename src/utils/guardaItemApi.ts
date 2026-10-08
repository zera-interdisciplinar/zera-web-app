import type { ItemResponse } from '../types/apiReal'
import { ApiError } from '../types/api'
import { ehModeloApi, normalizarModeloApi } from './guardaModeloApi'
import { ehObjeto, ehTexto, ehDataIso } from './guardasApi'

export function ehItemApi(valor: unknown): valor is ItemResponse {
  return ehObjeto(valor) && ehTexto(valor.id) && valor.id.trim().length > 0
    && ehTexto(valor.unitId) && valor.unitId.trim().length > 0 && ehTexto(valor.barcode) && valor.barcode.trim().length > 0
    && (valor.displayCode === null || ehTexto(valor.displayCode)) && (valor.name === null || ehTexto(valor.name))
    && (valor.model === null || ehModeloApi(valor.model))
    && (valor.createdByName === null || ehTexto(valor.createdByName))
    && (valor.createdBy === undefined || valor.createdBy === null || ehTexto(valor.createdBy))
    && ehDataIso(valor.createdAt) && ehDataIso(valor.updatedAt)
    && ehTexto(valor.status) && valor.status.trim().length > 0
    && (valor.condition === null || ehTexto(valor.condition))
}
export function lerItemApi(valor: unknown): ItemResponse {
  if (!ehObjeto(valor)) throw new ApiError('Não conseguimos ler os dados do item. Tente novamente.', 0)
  const normalizado = { ...valor, displayCode: valor.displayCode ?? null, name: valor.name ?? null,
    createdByName: valor.createdByName ?? null, createdBy: valor.createdBy ?? null, condition: valor.condition ?? null,
    model: valor.model == null ? null : normalizarModeloApi(valor.model) }
  if (!ehItemApi(normalizado)) throw new ApiError('Não conseguimos ler os dados do item. Tente novamente.', 0)
  return normalizado
}
