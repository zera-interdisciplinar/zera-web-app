import { afterEach, expect, it, vi } from 'vitest'
vi.mock('../src/services/apiReal', () => ({ modoDemonstracao: false, requisitarApiReal: vi.fn() }))
import { requisitarApiReal } from '../src/services/apiReal'
import { criarCategoria, listarCategorias } from '../src/services/categoriaService'
const categoria = { id: 'categoria-local', unitId: 'unidade-local', name: 'Eletrônicos', description: null }
afterEach(() => vi.resetAllMocks())
it('lê categoria válida e descrição nula', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue([categoria])
  expect(await listarCategorias()).toEqual([expect.objectContaining({ nome: 'Eletrônicos', descricao: '' })])
})
it('lista vazia é válida', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue([])
  expect(await listarCategorias()).toEqual([])
})
it.each([null, {}, [null], [{ ...categoria, id: undefined }], [{ ...categoria, name: 1 }]])('rejeita lista inválida %j', async valor => {
  vi.mocked(requisitarApiReal).mockResolvedValue(valor)
  await expect(listarCategorias()).rejects.toThrow('Tente novamente')
})
it('valida resposta de cadastro', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue(categoria)
  await expect(criarCategoria({ nome: 'Eletrônicos', descricao: 'Equipamentos', diasLimiteDescarte: 90, exigeChecklistPericulosidade: false })).resolves.toMatchObject({ nome: 'Eletrônicos' })
  vi.mocked(requisitarApiReal).mockResolvedValue(null)
  await expect(criarCategoria({ nome: 'Eletrônicos', descricao: 'Equipamentos', diasLimiteDescarte: 90, exigeChecklistPericulosidade: false })).rejects.toThrow('Tente novamente')
})
