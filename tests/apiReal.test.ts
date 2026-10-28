import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('cliente das APIs reais', () => {
  it('não reutiliza a base de analytics como base de autenticação', async () => {
    vi.stubEnv('VITE_ADMIN_API_URL', '')
    vi.stubEnv('VITE_API_BASE_URL', 'https://analytics.example.invalid')
    const busca = vi.fn()
    vi.stubGlobal('fetch', busca)
    const { requisitarApiReal } = await import('../src/services/apiReal')
    await expect(requisitarApiReal('administrative', '/api/v1/auth/login', { metodo: 'POST', autenticada: false })).rejects.toThrow('não está configurada')
    expect(busca).not.toHaveBeenCalled()
  })
  it('não ativa mocks em um build de produção mesmo se a flag estiver ligada', async () => {
    vi.stubEnv('DEV', false)
    vi.stubEnv('VITE_USE_MSW', 'true')
    const { modoDemonstracao } = await import('../src/services/apiReal')
    expect(modoDemonstracao).toBe(false)
  })

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
