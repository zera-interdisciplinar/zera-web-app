import type { ItemResponse } from '../types/apiReal'
import { ApiError } from '../types/api'
import { ehModeloApi } from './guardaModeloApi'
import { ehObjeto, ehTexto, ehDataIso } from './guardasApi'

export function ehItemApi(valor: unknown): valor is ItemResponse {
  return ehObjeto(valor) && ehTexto(valor.id) && valor.id.trim().length > 0
    && ehTexto(valor.unitId) && valor.unitId.trim().length > 0 && ehTexto(valor.barcode)
    && (valor.displayCode === null || ehTexto(valor.displayCode)) && (valor.name === null || ehTexto(valor.name))
    && (valor.model === null || ehModeloApi(valor.model))
    && (valor.createdByName === null || ehTexto(valor.createdByName))
    && (valor.createdBy === undefined || valor.createdBy === null || ehTexto(valor.createdBy))
    && ehDataIso(valor.createdAt) && ehDataIso(valor.updatedAt)
    && (valor.status === 'DRAFT' || valor.status === 'PENDING_APPROVAL' || valor.status === 'REJECTED' || valor.status === 'IN_STOCK' || valor.status === 'IN_MAINTENANCE' || valor.status === 'AWAITING_EVALUATION' || valor.status === 'DISPOSED' || valor.status === 'REMOVED')
    && (valor.condition === null || valor.condition === 'NEW' || valor.condition === 'USED' || valor.condition === 'SEMI_DAMAGED' || valor.condition === 'DAMAGED')
}
export function lerItemApi(valor: unknown): ItemResponse {
  if (!ehItemApi(valor)) throw new ApiError('Não conseguimos ler os dados do item. Tente novamente.', 0)
  return valor
}
