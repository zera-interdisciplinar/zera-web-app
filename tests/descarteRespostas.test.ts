import { afterEach, expect, it, vi } from 'vitest'
vi.mock('../src/services/apiReal', () => ({ requisitarApiReal: vi.fn(), listarPaginas: vi.fn() }))
import { requisitarApiReal, listarPaginas } from '../src/services/apiReal'
import { registrarDescarte, buscarLocaisReciclagem, listarItensElegiveisDescarte } from '../src/services/descarteService'
const entrada = { destination: 'RECYCLING' satisfies 'RECYCLING', itemIds: ['33333333-3333-4333-8333-333333333333'] }
const descarte = { id: 'descarte-local', unitId: 'unidade-local', destination: 'RECYCLING', placeId: null, placeName: null, disposedAt: '2026-10-29', notes: null, items: [], totalWeightKg: 0, createdByName: null, createdAt: '2026-10-29T10:00:00Z' }
const local = { placeId: 'local', name: 'Local', address: 'Endereço', lat: 0, lng: 0, distanceMeters: 0, isOpen: null, description: null, openingHours: [] }
afterEach(() => vi.resetAllMocks())
it('confirma descarte válido com nulos e zero legítimo', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue(descarte)
  await expect(registrarDescarte(entrada)).resolves.toEqual(descarte)
})
it.each([null, {}, [], { ...descarte, id: undefined }, { ...descarte, totalWeightKg: '0' }, { ...descarte, totalWeightKg: -1 }, { ...descarte, disposedAt: '2026-02-30' }])('rejeita descarte inválido %j', async valor => {
  vi.mocked(requisitarApiReal).mockResolvedValue(valor)
  await expect(registrarDescarte(entrada)).rejects.toThrow('Tente novamente')
})
it('lê locais válidos e vazios', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue([local])
  await expect(buscarLocaisReciclagem({ lat: 0, lng: 0 })).resolves.toEqual([local])
  vi.mocked(requisitarApiReal).mockResolvedValue([])
  await expect(buscarLocaisReciclagem({ lat: 0, lng: 0 })).resolves.toEqual([])
  vi.mocked(listarPaginas).mockResolvedValue([])
  await expect(listarItensElegiveisDescarte()).resolves.toEqual([])
})
it.each([null, {}, [null], [{ ...local, lat: 91 }], [{ ...local, distanceMeters: '0' }], [{ ...local, name: undefined }]])('rejeita locais inválidos %j', async valor => {
  vi.mocked(requisitarApiReal).mockResolvedValue(valor)
  await expect(buscarLocaisReciclagem({ lat: 0, lng: 0 })).rejects.toThrow('Tente novamente')
})

it('preserva destino futuro para apresentação neutra', async () => {
  vi.mocked(requisitarApiReal).mockResolvedValue({ ...descarte, destination: 'FUTURO' })
  expect(await registrarDescarte(entrada)).toMatchObject({ destination: 'FUTURO' })
})
