import { afterEach, expect, it, vi } from 'vitest'
vi.mock('../src/services/apiReal', () => ({ requisitarApiReal: vi.fn() }))
import { requisitarApiReal } from '../src/services/apiReal'
import { criarModeloReal, listarMateriais } from '../src/services/cadastroModeloService'
const material = { id: 'material-local', code: 'METAL', name: 'Metal', recyclable: true, hazardous: false, disposalGuide: null }
const modelo = { id: 'modelo-local', unitId: 'unidade-local', name: 'Modelo', manufacturer: 'Fabricante', expectedLifespanMonths: 24, warrantyMonths: null, estimatedWeightKg: null, materials: [material], notes: null, approvalStatus: 'APPROVED', category: { id: 'categoria-local', unitId: 'unidade-local', name: 'Categoria', description: null } }
const entrada = { name: 'Modelo', manufacturer: 'Fabricante', categoryId: '33333333-3333-4333-8333-333333333333', materials: ['METAL'] satisfies Array<'METAL'> }
afterEach(() => vi.resetAllMocks())
it('lê materiais válidos e lista vazia', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue([material])
  expect(await listarMateriais()).toEqual([material])
  vi.mocked(requisitarApiReal).mockResolvedValue([])
  expect(await listarMateriais()).toEqual([])
})
it.each([null, {}, [null], [{ ...material, id: undefined }], [{ ...material, recyclable: 'sim' }], [{ ...material, code: 'NOVO' }]])('rejeita materiais inválidos %j', async valor => {
  vi.mocked(requisitarApiReal).mockResolvedValue(valor)
  await expect(listarMateriais()).rejects.toThrow('Tente novamente')
})
it('confirma modelo válido, preserva null e neutraliza aprovação desconhecida', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue(modelo)
  expect(await criarModeloReal(entrada)).toMatchObject({ vidaUtilMeses: 24, garantiaMeses: null })
  vi.mocked(requisitarApiReal).mockResolvedValue({ ...modelo, approvalStatus: 'FUTURO' })
  expect(await criarModeloReal(entrada)).toMatchObject({ aprovacao: 'Não informado' })
})
it.each([null, {}, [], { ...modelo, category: null }, { ...modelo, name: undefined }, { ...modelo, warrantyMonths: '12' }, { ...modelo, estimatedWeightKg: -1 }])('rejeita modelo inválido %j', async valor => {
  vi.mocked(requisitarApiReal).mockResolvedValue(valor)
  await expect(criarModeloReal(entrada)).rejects.toThrow('Tente novamente')
})
