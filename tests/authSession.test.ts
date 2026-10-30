import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

async function preparar() {
  vi.stubEnv('VITE_USE_MSW', 'false')
  vi.stubEnv('VITE_ADMIN_API_URL', 'https://admin.example.invalid')
  const fetch = vi.fn()
    .mockResolvedValueOnce(Response.json({ userId: 'user', accessToken: 'access-1', refreshToken: 'refresh-1', tokenType: 'Bearer', expiresIn: 60 }))
    .mockResolvedValueOnce(Response.json({ userId: 'user', name: 'Teste', email: 'teste@example.invalid', role: 'MANAGER', status: 'ACTIVE', unitId: 'unit' }))
  vi.stubGlobal('fetch', fetch)
  const auth = await import('../src/services/authService')
  const api = await import('../src/services/apiReal')
  await auth.autenticar({ email: 'teste@example.invalid', senha: 'senha-local' })
  return { fetch, auth, api }
}

it('renova e rotaciona tokens mantendo a unidade apenas em memória', async () => {
  const { fetch, auth, api } = await preparar()
  fetch.mockResolvedValueOnce(Response.json({ userId: 'user', accessToken: 'access-2', refreshToken: 'refresh-2', tokenType: 'Bearer', expiresIn: 120 }))
  const validade = await auth.renovarSessao()
  expect(Date.parse(validade)).toBeGreaterThan(Date.now())
  expect(api.obterSessaoApi()).toEqual({ accessToken: 'access-2', unitId: 'unit' })
  expect(fetch.mock.calls[2][0].pathname).toBe('/api/v1/auth/refresh')
  expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ refreshToken: 'refresh-1' })
  fetch.mockResolvedValueOnce(Response.json({ userId: 'user', accessToken: 'access-3', refreshToken: 'refresh-3', tokenType: 'Bearer', expiresIn: 120 }))
  await auth.renovarSessao()
  expect(JSON.parse(fetch.mock.calls[3][1].body)).toEqual({ refreshToken: 'refresh-2' })
})

it('não restaura sessão quando a renovação termina depois de sair', async () => {
  const { fetch, auth, api } = await preparar()
  let responder!: (resposta: Response) => void
  fetch.mockImplementationOnce(() => new Promise<Response>((resolve) => { responder = resolve }))
  const renovacao = auth.renovarSessao()
  auth.limparRenovacaoSessao()
  api.definirSessaoApi(null, null)
  responder(Response.json({ accessToken: 'tardio', refreshToken: 'tardio', expiresIn: 120 }))
  await expect(renovacao).rejects.toMatchObject({ name: 'AbortError' })
  expect(api.obterSessaoApi().accessToken).toBeNull()
})

it('recusa resposta de renovação sem refresh token', async () => {
  const { fetch, auth, api } = await preparar()
  fetch.mockResolvedValueOnce(Response.json({ accessToken: 'incompleto', expiresIn: 120 }))
  await expect(auth.renovarSessao()).rejects.toThrow('incompleta')
  expect(api.obterSessaoApi().accessToken).toBe('access-1')
})
