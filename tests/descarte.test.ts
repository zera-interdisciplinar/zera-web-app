import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { validarNovoDescarte } from '../src/utils/validacaoDescarte'
import type { NovoDescarte } from '../src/types/descarte'

const id = 'bb9e2f7d-b386-440a-ab0e-9a3b29fa1111'
const entrada: NovoDescarte = { destination: 'RECYCLING', placeId: 'ponto-externo', placeName: 'Ponto de coleta', itemIds: [id], disposedAt: '2026-09-20' }
let busca: ReturnType<typeof vi.fn>
beforeEach(async () => {
  vi.stubEnv('VITE_USE_MSW', 'false')
  vi.stubEnv('VITE_INVENTORY_API_URL', 'https://inventory.example.invalid')
  vi.stubEnv('VITE_ADMIN_API_URL', 'https://admin.example.invalid')
  busca = vi.fn()
  vi.stubGlobal('fetch', busca)
  const { definirSessaoApi } = await import('../src/services/apiReal')
  definirSessaoApi('token', id)
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

describe('contratos de destinação v1', () => {
  it('consulta a elegibilidade no servidor sem inventar estados de descarte', async () => {
    busca.mockResolvedValue(Response.json({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }))
    const { listarItensElegiveisDescarte } = await import('../src/services/descarteService')
    await expect(listarItensElegiveisDescarte()).resolves.toEqual([])
    expect(busca.mock.calls[0][0].searchParams.get('eligibleForDisposal')).toBe('true')
  })
  it('registra descarte realizado com local externo sem parceiro, autoria ou peso no corpo', async () => {
    busca.mockResolvedValue(Response.json({ id: 'descarte', ...entrada }, { status: 201 }))
    const { registrarDescarte } = await import('../src/services/descarteService')
    await registrarDescarte(entrada)
    const [url, opcoes] = busca.mock.calls[0]
    expect(url.pathname).toBe('/api/v1/disposals')
    expect(url.search).toBe('')
    expect(opcoes.method).toBe('POST')
    expect(JSON.parse(opcoes.body)).toEqual(entrada)
    expect(opcoes.headers).toHaveProperty('X-Unit-Id', id)
  })
  it('rejeita data futura e datas inexistentes; aceita data omitida', () => {
    const hoje = new Date('2026-10-07T12:00:00')
    expect(validarNovoDescarte({ ...entrada, disposedAt: '2026-10-08' }, hoje).erros.disposedAt).toContain('futuro')
    expect(validarNovoDescarte({ ...entrada, disposedAt: '2026-02-30' }, hoje).valido).toBe(false)
    expect(validarNovoDescarte({ ...entrada, disposedAt: undefined }, hoje).valido).toBe(true)
    expect(validarNovoDescarte({ ...entrada, disposedAt: '2026-10-07' }, hoje).valido).toBe(true)
  })
  it('barra identificadores inválidos e mantém conflito retornado pelo servidor', async () => {
    const { registrarDescarte } = await import('../src/services/descarteService')
    await expect(registrarDescarte({ ...entrada, itemIds: ['004218'] })).rejects.toMatchObject({ status: 422 })
    expect(busca).not.toHaveBeenCalled()
    busca.mockResolvedValue(new Response('{}', { status: 409 }))
    await expect(registrarDescarte(entrada)).rejects.toMatchObject({ status: 409 })
  })
  it('consulta locais por coordenadas e exclui vínculos de parceiros da resposta', async () => {
    busca.mockResolvedValue(Response.json([{ placeId: 'ponto', name: 'Coleta', address: 'Rua', lat: -23.5, lng: -46.6, distanceMeters: 100, isOpen: null, description: null, openingHours: [], recyclingBusinessId: id, email: 'ignorado@example.invalid' }]))
    const { buscarLocaisReciclagem } = await import('../src/services/descarteService')
    const controlador = new AbortController()
    const sinal = controlador.signal
    const locais = await buscarLocaisReciclagem({ lat: -23.5, lng: -46.6, radiusMeters: 2000 }, sinal)
    expect(busca.mock.calls[0][0].pathname).toBe('/api/v1/recycling-places')
    expect(busca.mock.calls[0][0].searchParams.get('radiusMeters')).toBe('2000')
    controlador.abort()
    expect(busca.mock.calls[0][1].signal.aborted).toBe(true)
    expect(locais[0]).not.toHaveProperty('recyclingBusinessId')
    expect(locais[0]).not.toHaveProperty('email')
  })
  it('não envia coordenadas nem cadastros de recicladora inválidos', async () => {
    const { buscarLocaisReciclagem } = await import('../src/services/descarteService')
    await expect(buscarLocaisReciclagem({ lat: 91, lng: 0 })).rejects.toMatchObject({ status: 422 })
    const { criarRecicladora } = await import('../src/services/relatorioService')
    await expect(criarRecicladora({ nome: 'Empresa', cnpj: '', cidade: '' })).rejects.toMatchObject({ status: 422 })
    expect(busca).not.toHaveBeenCalled()
  })
})
