import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const modelo = { id: 'm', unitId: 'u', name: 'Modelo', manufacturer: 'Marca', expectedLifespanMonths: null, warrantyMonths: null, notes: null, materials: [], category: { id: 'c', unitId: 'u', name: 'Categoria', description: null }, approvalStatus: 'APPROVED' }
let busca: ReturnType<typeof vi.fn>
beforeEach(async () => {
  vi.stubEnv('VITE_USE_MSW', 'false')
  vi.stubEnv('VITE_INVENTORY_API_URL', 'https://inventory.example.invalid')
  busca = vi.fn()
  vi.stubGlobal('fetch', busca)
  const { definirSessaoApi } = await import('../src/services/apiReal')
  definirSessaoApi('token', 'u')
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

it('lê todas as páginas e filtra por categoria', async () => {
  busca.mockResolvedValueOnce(Response.json({ content: [modelo], totalElements: 2, totalPages: 2 }))
    .mockResolvedValueOnce(Response.json({ content: [{ ...modelo, id: 'm2' }], totalElements: 2, totalPages: 2 }))
  const { listarModelosPorCategoria } = await import('../src/services/modeloService')
  expect(await listarModelosPorCategoria('c')).toHaveLength(2)
  expect(busca).toHaveBeenCalledTimes(2)
})
it('aceita lista vazia', async () => {
  busca.mockResolvedValue(Response.json({ content: [], totalElements: 0, totalPages: 0 }))
  const { listarModelos } = await import('../src/services/modeloService')
  expect(await listarModelos()).toEqual([])
})
it.each([null, {}, { content: [], totalElements: 1, totalPages: 1 }, { content: [null], totalElements: 1, totalPages: 1 }, { content: [{ ...modelo, id: undefined }], totalElements: 1, totalPages: 1 }, { content: [{ ...modelo, manufacturer: 1 }], totalElements: 1, totalPages: 1 }])('recusa envelope ou modelo inválido %j', async resposta => {
  busca.mockResolvedValue(Response.json(resposta))
  const { listarModelos } = await import('../src/services/modeloService')
  await expect(listarModelos()).rejects.toThrow('Tente novamente')
})
