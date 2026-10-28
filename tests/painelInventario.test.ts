import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

async function preparar(corpo: unknown) {
  vi.stubEnv('VITE_INVENTORY_API_URL', 'https://inventory.example.invalid')
  const busca = vi.fn().mockResolvedValue(Response.json(corpo))
  vi.stubGlobal('fetch', busca)
  const api = await import('../src/services/apiReal')
  api.definirSessaoApi('jwt-teste', 'unidade-teste')
  return { busca, painel: await import('../src/services/painelInventarioService') }
}

it('consulta o resumo com JWT e unidade, preservando variação nula', async () => {
  const { busca, painel } = await preparar({ activeItems: 39, activeItemsChangePercent: null, pendingApproval: 6, inMaintenance: 3, awaitingEvaluation: 0, disposalsInWindow: 2 })
  expect(await painel.obterResumoOperacional()).toMatchObject({ activeItems: 39, pendingApproval: 6, activeItemsChangePercent: null })
  expect(busca.mock.calls[0][0].pathname).toBe('/api/v1/dashboard/home')
  expect(busca.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer jwt-teste', 'X-Unit-Id': 'unidade-teste' })
})

it('não transforma resposta incompleta em zero', async () => {
  const { painel } = await preparar({ activeItems: 39 })
  await expect(painel.obterResumoOperacional()).rejects.toThrow('contrato esperado')
})

it('preserva taxas nulas e pesos reais dos indicadores', async () => {
  const { painel } = await preparar({ totalWeightKg: 12.5, recyclingRatePercent: null, recyclingRateChangePoints: null, totalWeightChangePercent: null, monthlyWeightKg: [{ month: '2026-10', weightKg: 12.5 }] })
  expect(await painel.obterIndicadoresDescarte()).toMatchObject({ totalWeightKg: 12.5, recyclingRatePercent: null })
})

it('preserva materiais e recusa pesos ausentes sem completar com zero', async () => {
  const base = { totalWeightKg: 10, recyclingRatePercent: null, recyclingRateChangePoints: null, totalWeightChangePercent: null, monthlyWeightKg: [] }
  const { painel, busca } = await preparar({ ...base, weightByMaterial: [{ material: 'METAL', weightKg: 10, percent: 100 }] })
  expect((await painel.obterIndicadoresDescarte()).weightByMaterial).toEqual([{ material: 'METAL', weightKg: 10, percent: 100 }])
  busca.mockResolvedValueOnce(Response.json({ ...base, weightByMaterial: [{ material: 'METAL', percent: 100 }] }))
  await expect(painel.obterIndicadoresDescarte()).rejects.toThrow()
})
