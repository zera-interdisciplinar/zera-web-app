import { afterEach, expect, it, vi } from 'vitest'
vi.mock('../src/services/apiReal', () => ({ requisitarApiReal: vi.fn() }))
import { requisitarApiReal } from '../src/services/apiReal'
import { listarEmpresasReciclagem } from '../src/services/recicladoraService'
const empresa = { id: 'recicladora-local', name: 'Recicladora local', cnpj: '11222333000181', email: null }
afterEach(() => vi.resetAllMocks())
it('lê resposta válida e email nulo', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue([empresa])
  await expect(listarEmpresasReciclagem()).resolves.toEqual([expect.objectContaining({ id: empresa.id, nome: empresa.name })])
})
it('aceita lista vazia', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue([])
  await expect(listarEmpresasReciclagem()).resolves.toEqual([])
})
it.each([null, {}, [null], [{ ...empresa, id: undefined }], [{ ...empresa, cnpj: 123 }], [{ ...empresa, name: '' }]])('rejeita resposta inválida %j', async valor => {
  vi.mocked(requisitarApiReal).mockResolvedValue(valor)
  await expect(listarEmpresasReciclagem()).rejects.toThrow('Tente novamente')
})
