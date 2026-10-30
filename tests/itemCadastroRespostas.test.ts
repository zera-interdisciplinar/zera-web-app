import { afterEach, expect, it, vi } from 'vitest'
vi.mock('../src/services/apiReal', () => ({ requisitarApiReal: vi.fn() }))
import { requisitarApiReal } from '../src/services/apiReal'
import { criarItemReal, removerItemReal } from '../src/services/itemCadastroService'
const entrada = { name: 'Item local', barcode: 'ETQ-001', modelId: '33333333-3333-4333-8333-333333333333', condition: 'NEW' satisfies 'NEW', usageIntensity: 1, hasDamages: false }
const item = { id: 'item-local', unitId: 'unidade-local', barcode: 'ETQ-001', displayCode: null, name: null, model: null, createdByName: null, createdAt: '2026-10-29T10:00:00', updatedAt: '2026-10-29T10:00:00Z', status: 'DRAFT', condition: null }
afterEach(() => vi.resetAllMocks())
it('confirma item com campos nulos', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue(item)
  await expect(criarItemReal(entrada)).resolves.toMatchObject({ id: item.id })
})
it('enum futuro tem texto neutro, sem simular estado conhecido', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue({ ...item, status: 'FUTURO', condition: 'FUTURA' })
  await expect(criarItemReal(entrada)).resolves.toMatchObject({ status: 'nao-informado', condicao: 'nao-informada' })
})
it.each([null, {}, [], { ...item, id: undefined }, { ...item, barcode: 12 }, { ...item, createdAt: 'ontem' }])('rejeita resposta inválida %j', async valor => {
  vi.mocked(requisitarApiReal).mockResolvedValue(valor)
  await expect(criarItemReal(entrada)).rejects.toThrow('Tente novamente')
})
it('remoção exige resposta sem conteúdo', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue(undefined)
  await expect(removerItemReal('item-local')).resolves.toBeUndefined()
  vi.mocked(requisitarApiReal).mockResolvedValue({})
  await expect(removerItemReal('item-local')).rejects.toThrow('tentar novamente')
})
