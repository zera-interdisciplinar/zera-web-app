import { afterEach, expect, it, vi } from 'vitest'
vi.mock('../src/services/apiReal', () => ({ modoDemonstracao: false, requisitarApiReal: vi.fn(), listarPaginas: vi.fn() }))
import { requisitarApiReal, listarPaginas } from '../src/services/apiReal'
import { buscarProduto, listarProdutos } from '../src/services/produtoService'
const item = { id: 'item-local', unitId: 'unidade-local', barcode: 'ETQ-001', displayCode: null, name: null, model: null, createdByName: null, createdAt: '2026-10-29T10:00:00', updatedAt: '2026-10-29T10:00:00Z', status: 'DRAFT', condition: null }
afterEach(() => vi.resetAllMocks())
it('lê item válido com campos nulos', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue(item)
  expect(await buscarProduto('item-local')).toMatchObject({ id: 'item-local', condicao: 'nao-informada' })
})
it('preserva lista vazia', async () => {
  vi.mocked(listarPaginas).mockResolvedValue([])
  expect(await listarProdutos()).toEqual([])
})
it.each([null, {}, [], { ...item, id: undefined }, { ...item, barcode: 123 }, { ...item, createdAt: '2026-02-30' }])('rejeita detalhe inválido %j', async valor => {
  vi.mocked(requisitarApiReal).mockResolvedValue(valor)
  await expect(buscarProduto('item-local')).rejects.toThrow('Tente novamente')
})
it('não esconde registro inválido na lista', async () => {
  vi.mocked(listarPaginas).mockResolvedValue([item, null])
  await expect(listarProdutos()).rejects.toThrow('Tente novamente')
})
