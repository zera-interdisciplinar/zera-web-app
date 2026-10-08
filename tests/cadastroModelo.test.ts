import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validarCadastroModeloReal } from '../src/utils/validacaoCadastroModelo'
import type { CadastroModeloReal } from '../src/types/cadastroModelo'

const categoria = 'bb9e2f7d-b386-440a-ab0e-9a3b29fa1111'
const dados: CadastroModeloReal = { name: 'Monitor', manufacturer: 'Fabricante', categoryId: categoria, materials: ['SCREEN', 'PLASTIC'] }
let busca: ReturnType<typeof vi.fn>
beforeEach(async () => {
  vi.stubEnv('VITE_USE_MSW', 'false')
  vi.stubEnv('VITE_INVENTORY_API_URL', 'https://inventory.example.invalid')
  busca = vi.fn()
  vi.stubGlobal('fetch', busca)
  const { definirSessaoApi } = await import('../src/services/apiReal')
  definirSessaoApi('token', categoria)
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

describe('cadastro real de modelos', () => {
  it('envia códigos de material e categoria; autoria vem do token', async () => {
    busca.mockResolvedValue(Response.json({ id: 'modelo', unitId: categoria, ...dados, category: { id: categoria, unitId: categoria, name: 'Monitores', description: null }, materials: [{ id: 'material', code: 'SCREEN', name: 'Tela', recyclable: true, hazardous: false, disposalGuide: null }], expectedLifespanMonths: null, warrantyMonths: null, estimatedWeightKg: null, notes: null, approvalStatus: 'PENDING' }, { status: 201 }))
    const { criarModeloReal } = await import('../src/services/cadastroModeloService')
    expect((await criarModeloReal(dados)).id).toBe('modelo')
    expect(busca.mock.calls[0][0].pathname).toBe('/api/v1/models')
    expect(busca.mock.calls[0][0].search).toBe('')
    expect(JSON.parse(busca.mock.calls[0][1].body)).toEqual(dados)
    expect(busca.mock.calls[0][1].headers).toHaveProperty('X-Unit-Id', categoria)
  })
  it('rejeita ausência de materiais antes da chamada', async () => {
    const { criarModeloReal } = await import('../src/services/cadastroModeloService')
    await expect(criarModeloReal({ ...dados, materials: [] })).rejects.toMatchObject({ status: 422, campo: 'materials' })
    expect(busca).not.toHaveBeenCalled()
  })
  it('mantém campos opcionais ausentes e valida valores positivos informados', () => {
    expect(validarCadastroModeloReal(dados).dados).not.toHaveProperty('estimatedWeightKg')
    expect(validarCadastroModeloReal({ ...dados, warrantyMonths: 0 }).erros.warrantyMonths).toBeDefined()
    expect(validarCadastroModeloReal({ ...dados, expectedLifespanMonths: 1.5 }).erros.expectedLifespanMonths).toBeDefined()
    expect(validarCadastroModeloReal({ ...dados, estimatedWeightKg: NaN }).erros.estimatedWeightKg).toBeDefined()
    expect(validarCadastroModeloReal({ ...dados, estimatedWeightKg: 2.5 }).valido).toBe(true)
  })
  it('sanitiza textos e mantém conflitos retornados pela API', async () => {
    expect(validarCadastroModeloReal({ ...dados, name: '<b>Monitor</b>' }).dados.name).toBe('Monitor')
    busca.mockResolvedValue(new Response('{}', { status: 409 }))
    const { criarModeloReal } = await import('../src/services/cadastroModeloService')
    await expect(criarModeloReal(dados)).rejects.toMatchObject({ status: 409 })
  })
  it('consulta catálogo de materiais pelo contrato documentado com cancelamento', async () => {
    busca.mockResolvedValue(Response.json([{ id: 'material', code: 'SCREEN', name: 'Tela', recyclable: true, hazardous: false, disposalGuide: null }]))
    const { listarMateriais } = await import('../src/services/cadastroModeloService')
    const controlador = new AbortController()
    const sinal = controlador.signal
    expect((await listarMateriais(sinal))[0].code).toBe('SCREEN')
    expect(busca.mock.calls[0][0].pathname).toBe('/api/v1/materials')
    controlador.abort()
    expect(busca.mock.calls[0][1].signal.aborted).toBe(true)
  })
})
