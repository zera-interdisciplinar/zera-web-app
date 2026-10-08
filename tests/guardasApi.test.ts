import { describe, expect, it } from 'vitest'
import { ehObjeto, ehTexto, ehNumeroFinito, ehDataIso, ehPagina, lerLista } from '../src/utils/guardasApi'

describe('guardas de respostas externas', () => {
  it('aceita objetos e rejeita null e arrays', () => {
    expect(ehObjeto({})).toBe(true)
    for (const valor of [null, [], 1, 'texto']) expect(ehObjeto(valor)).toBe(false)
  })
  it('texto não converte outros tipos', () => {
    expect(ehTexto('')).toBe(true)
    expect(ehTexto(1)).toBe(false)
    expect(ehTexto(null)).toBe(false)
  })
  it('números precisam ser finitos', () => {
    expect(ehNumeroFinito(0)).toBe(true)
    for (const valor of [NaN, Infinity, '0', null]) expect(ehNumeroFinito(valor)).toBe(false)
  })
  it('confere calendário e formato ISO, inclusive o horário sem offset observado', () => {
    for (const valor of ['2026-10-29', '2026-10-29T12:00:00', '2026-10-29T12:00:00.123456Z', '2024-02-29T12:00:00-03:00']) expect(ehDataIso(valor)).toBe(true)
    for (const valor of [null, 'ontem', '2026-02-30', '2026-10-29T99:00:00', '2026-13-01']) expect(ehDataIso(valor)).toBe(false)
  })
  it('confere totais e envelope vazio sem confundir página parcial com lista completa', () => {
    expect(ehPagina({ content: [], totalElements: 0, totalPages: 0 })).toBe(true)
    expect(ehPagina({ content: [1], totalElements: 2, totalPages: 2 })).toBe(true)
    for (const valor of [null, {}, { content: [], totalElements: '0', totalPages: 0 }, { content: [1], totalElements: 0, totalPages: 0 }, { content: [], totalElements: 2, totalPages: -1 }]) expect(ehPagina(valor)).toBe(false)
  })
  it('retorna listas tipadas, preserva vazio e rejeita entradas inválidas', () => {
    expect(lerLista(['a'], ehTexto)).toEqual(['a'])
    expect(lerLista([], ehTexto)).toEqual([])
    for (const valor of [null, {}, ['a', 1]]) expect(() => lerLista(valor, ehTexto)).toThrow('Tente novamente')
  })
})
