import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('cliente das APIs reais', () => {
  it('recusa transporte HTTP remoto antes de chamar fetch', async () => {
    vi.stubEnv('VITE_ADMIN_API_URL', 'http://example.invalid/qa/administrative/swagger-ui')
    vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } })
    const busca = vi.fn()
    vi.stubGlobal('fetch', busca)
    const { requisitarApiReal } = await import('../src/services/apiReal')
    await expect(requisitarApiReal('administrative', '/api/v1/auth/login', { metodo: 'POST', autenticada: false })).rejects.toThrow('sem HTTPS')
    expect(busca).not.toHaveBeenCalled()
  })

  it('não inventa uma base quando a variável pública está ausente', async () => {
    vi.stubEnv('VITE_INVENTORY_API_URL', '')
    const { requisitarApiReal } = await import('../src/services/apiReal')
    await expect(requisitarApiReal('inventory', '/api/v1/items')).rejects.toThrow('serviço está indisponível')
  })
})
