import type { CategoryResponse } from '../types/apiReal'
import { ehObjeto, ehTexto } from './guardasApi'

export function ehCategoriaApi(valor: unknown): valor is CategoryResponse {
  return ehObjeto(valor) && ehTexto(valor.id) && valor.id.trim().length > 0
    && ehTexto(valor.unitId) && valor.unitId.trim().length > 0
    && ehTexto(valor.name) && valor.name.trim().length > 0
    && (valor.description === null || ehTexto(valor.description))
}
