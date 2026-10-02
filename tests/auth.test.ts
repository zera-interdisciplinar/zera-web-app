import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchControlado = vi.fn()

beforeEach(() => {
  vi.stubEnv('VITE_USE_MSW', 'false')
  vi.stubEnv('VITE_ADMIN_API_URL', 'https://admin.example.invalid')
  vi.stubEnv('VITE_INVENTORY_API_URL', 'https://inventory.example.invalid')
  vi.stubGlobal('fetch', fetchControlado)
  fetchControlado.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

function prepararResposta(role: string) {
  const userId = crypto.randomUUID()
  const unitId = crypto.randomUUID()
  fetchControlado
    .mockResolvedValueOnce(Response.json({ accessToken: crypto.randomUUID(), userId, expiresIn: 300 }))
    .mockResolvedValueOnce(Response.json({ userId, unitId, name: 'Conta de teste', email: 'teste@example.invalid', role }))
  return unitId
}

describe('autenticação real com respostas controladas, sem sessão backend comprovada', () => {
  it.each([['MANAGER', 'gestor'], ['EMPLOYEE', 'funcionario']])('mapeia somente o papel documentado %s', async (role, perfil) => {
    const unitId = prepararResposta(role)
    const { autenticar } = await import('../src/services/authService')
    const sessao = await autenticar({ email: 'teste@example.invalid', senha: crypto.randomUUID() })
    expect(sessao.usuario.perfil).toBe(perfil)
    expect(sessao.usuario.unidade).toBe(unitId)
    expect(Date.parse(sessao.expiraEm)).toBeGreaterThan(Date.now())
    const { requisitarApiReal } = await import('../src/services/apiReal')
    fetchControlado.mockResolvedValueOnce(Response.json([]))
    await requisitarApiReal('inventory', '/api/v1/categories', { unidade: true })
    expect(fetchControlado.mock.calls[2][1].headers['X-Unit-Id']).toBe(unitId)
    expect(fetchControlado.mock.calls[0][0].pathname).toBe('/api/v1/auth/login')
    expect(fetchControlado.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })

  it.each(['ADMIN', 'ADMINISTRADOR'])('recusa %s no contrato QA e limpa a sessão provisória', async (role) => {
    prepararResposta(role)
    const { autenticar } = await import('../src/services/authService')
    await expect(autenticar({ email: 'teste@example.invalid', senha: crypto.randomUUID() })).rejects.toThrow('Perfil não previsto')
    const { requisitarApiReal } = await import('../src/services/apiReal')
    await expect(requisitarApiReal('inventory', '/api/v1/items')).rejects.toMatchObject({ status: 401 })
    expect(fetchControlado).toHaveBeenCalledTimes(2)
  })

  it.each([401, 403])('limpa a sessão se a identidade retorna HTTP %s', async (status) => {
    fetchControlado.mockResolvedValueOnce(Response.json({ accessToken: crypto.randomUUID(), userId: crypto.randomUUID(), expiresIn: 300 }))
    fetchControlado.mockResolvedValueOnce(new Response('{}', { status }))
    const { autenticar } = await import('../src/services/authService')
    await expect(autenticar({ email: 'teste@example.invalid', senha: crypto.randomUUID() })).rejects.toMatchObject({ status })
    const { requisitarApiReal } = await import('../src/services/apiReal')
    await expect(requisitarApiReal('inventory', '/api/v1/items')).rejects.toMatchObject({ status: 401 })
    expect(fetchControlado).toHaveBeenCalledTimes(2)
  })
})
