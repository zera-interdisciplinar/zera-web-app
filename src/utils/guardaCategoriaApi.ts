import type { CategoryResponse } from '../types/apiReal'
import { ehObjeto, ehTexto } from './guardasApi'
import { ApiError } from '../types/api'

export function ehCategoriaApi(valor: unknown): valor is CategoryResponse {
  return ehObjeto(valor) && ehTexto(valor.id) && valor.id.trim().length > 0
    && ehTexto(valor.unitId) && valor.unitId.trim().length > 0
    && ehTexto(valor.name) && valor.name.trim().length > 0
    && (valor.description === null || ehTexto(valor.description))
}

export function normalizarCategoriaApi(valor: unknown): unknown {
  return ehObjeto(valor) ? { ...valor, description: valor.description ?? null } : valor
}

export function lerCategoriaApi(valor: unknown): CategoryResponse {
  const normalizado = normalizarCategoriaApi(valor)
  if (!ehCategoriaApi(normalizado)) throw new ApiError('Não conseguimos ler a categoria. Tente novamente.', 0)
  return normalizado
}
