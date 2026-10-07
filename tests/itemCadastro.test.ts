import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validarCadastroItemReal } from '../src/utils/validacaoItemReal'
import type { CadastroItemReal } from '../src/types/cadastroItem'

const modelo = 'bb9e2f7d-b386-440a-ab0e-9a3b29fa1111'
const unidade = 'bb9e2f7d-b386-440a-ab0e-9a3b29fa2222'
const dados: CadastroItemReal = { name: 'Notebook', barcode: 'COD-001', modelId: modelo, condition: 'USED', usageIntensity: 4, hasDamages: false, damages: [] }
let busca: ReturnType<typeof vi.fn>

beforeEach(async () => {
  vi.stubEnv('VITE_USE_MSW', 'false')
  vi.stubEnv('VITE_INVENTORY_API_URL', 'https://inventory.example.invalid')
  busca = vi.fn()
  vi.stubGlobal('fetch', busca)
  const { definirSessaoApi } = await import('../src/services/apiReal')
  definirSessaoApi('token-de-teste', unidade)
})

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

describe('cadastro e remoção no inventário', () => {
  it('envia modelo existente, unidade e JWT sem autoria informada pelo cliente', async () => {
    busca.mockResolvedValue(Response.json({ id: 'item-1', ...dados, status: 'DRAFT', model: null, unitId: unidade, createdAt: '2026-10-07', updatedAt: '2026-10-07' }, { status: 201 }))
    const { criarItemReal } = await import('../src/services/itemCadastroService')
    expect((await criarItemReal(dados)).id).toBe('item-1')
    const [url, opcoes] = busca.mock.calls[0]
    expect(url.pathname).toBe('/api/v1/items')
    expect(url.search).toBe('')
    expect(opcoes.method).toBe('POST')
    expect(JSON.parse(opcoes.body)).toEqual(dados)
    expect(opcoes.headers).toMatchObject({ Authorization: 'Bearer token-de-teste', 'X-Unit-Id': unidade })
  })

  it('recusa dados inválidos antes de chamar o servidor', async () => {
    const { criarItemReal } = await import('../src/services/itemCadastroService')
    await expect(criarItemReal({ ...dados, barcode: '' })).rejects.toMatchObject({ status: 422, campo: 'barcode' })
    expect(busca).not.toHaveBeenCalled()
  })

  it('remove pelo identificador e aceita retorno sem conteúdo', async () => {
    busca.mockResolvedValue(new Response(null, { status: 204 }))
    const { removerItemReal } = await import('../src/services/itemCadastroService')
    await expect(removerItemReal('item/1')).resolves.toBeUndefined()
    const [url, opcoes] = busca.mock.calls[0]
    expect(url.pathname).toBe('/api/v1/items/item%2F1')
    expect(url.search).toBe('')
    expect(opcoes.method).toBe('DELETE')
    expect(opcoes.headers).toMatchObject({ Authorization: 'Bearer token-de-teste', 'X-Unit-Id': unidade })
  })

  it('preserva conflito de estado na remoção', async () => {
    busca.mockResolvedValue(new Response('{}', { status: 409 }))
    const { removerItemReal } = await import('../src/services/itemCadastroService')
    await expect(removerItemReal('item-1')).rejects.toMatchObject({ status: 409 })
  })

  it('sanitiza nome e código sem truncar silenciosamente entradas longas', () => {
    expect(validarCadastroItemReal({ ...dados, name: ' <b>Notebook</b> ' }).dados.name).toBe('Notebook')
    const resultado = validarCadastroItemReal({ ...dados, name: 'x'.repeat(121) })
    expect(resultado.valido).toBe(false)
    expect(resultado.erros.name).toContain('120')
  })
  it('exige escolhas explícitas de uso e danos antes do cadastro', async () => {
    const { criarItemReal } = await import('../src/services/itemCadastroService')
    await expect(criarItemReal({ ...dados, hasDamages: null })).rejects.toMatchObject({ campo: 'hasDamages', status: 422 })
    for (const usageIntensity of [NaN, Infinity, -1, 11, 2.5]) {
      await expect(criarItemReal({ ...dados, usageIntensity })).rejects.toMatchObject({ campo: 'usageIntensity', status: 422 })
    }
    await expect(criarItemReal({ ...dados, hasDamages: true, damages: [] })).rejects.toMatchObject({ campo: 'damages', status: 422 })
    expect(busca).not.toHaveBeenCalled()
  })
  it('envia tipos de dano selecionados e elimina duplicações', async () => {
    busca.mockResolvedValue(Response.json({ id: 'item-1', ...dados, status: 'DRAFT', model: null, createdAt: '2026-10-07', updatedAt: '2026-10-07' }))
    const { criarItemReal } = await import('../src/services/itemCadastroService')
    await criarItemReal({ ...dados, hasDamages: true, damages: ['OXIDATION', 'OXIDATION'] })
    expect(JSON.parse(busca.mock.calls[0][1].body)).toMatchObject({ usageIntensity: 4, hasDamages: true, damages: ['OXIDATION'] })
  })
})
