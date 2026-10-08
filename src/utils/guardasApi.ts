import { ApiError } from '../types/api'

export function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}

export function ehTexto(valor: unknown): valor is string {
  return typeof valor === 'string'
}

export function ehNumeroFinito(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor)
}

export function ehDataIso(valor: unknown): valor is string {
  if (!ehTexto(valor) || !/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(valor)) return false
  const ano = Number(valor.slice(0, 4))
  const mes = Number(valor.slice(5, 7))
  const dia = Number(valor.slice(8, 10))
  const civil = new Date(0)
  civil.setUTCFullYear(ano, mes - 1, dia)
  if (civil.getUTCFullYear() !== ano || civil.getUTCMonth() !== mes - 1 || civil.getUTCDate() !== dia) return false
  const instante = valor.includes('T') && !/(Z|[+-]\d{2}:\d{2})$/.test(valor) ? `${valor}Z` : valor
  return Number.isFinite(Date.parse(instante))
}

export function ehPagina(valor: unknown): valor is { totalElements: number; totalPages: number; content: unknown[] } {
  return ehObjeto(valor) && ehNumeroFinito(valor.totalElements) && Number.isInteger(valor.totalElements)
    && valor.totalElements >= 0 && ehNumeroFinito(valor.totalPages) && Number.isInteger(valor.totalPages)
    && valor.totalPages >= 0 && Array.isArray(valor.content)
    && valor.content.length <= valor.totalElements
    && (valor.totalElements === 0 ? valor.content.length === 0 && valor.totalPages <= 1 : valor.totalPages > 0)
}

export function lerLista<T>(valor: unknown, guarda: (item: unknown) => item is T): T[] {
  if (!Array.isArray(valor)) throw new ApiError('Não conseguimos ler a lista recebida. Tente novamente.', 0)
  const itens: T[] = []
  for (const item of valor) {
    if (!guarda(item)) throw new ApiError('A lista contém dados inválidos. Tente novamente.', 0)
    itens.push(item)
  }
  return itens
}
