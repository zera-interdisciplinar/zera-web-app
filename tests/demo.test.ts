import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

describe('isolamento da demonstração', () => {
  it('recusa o acesso de demonstração quando as APIs reais estão habilitadas', async () => {
    vi.stubEnv('VITE_USE_MSW', 'false')
    const fetchControlado = vi.fn()
    vi.stubGlobal('fetch', fetchControlado)
    const { abrirDemonstracao } = await import('../src/services/authService')
    await expect(abrirDemonstracao('administrador')).rejects.toMatchObject({ status: 403 })
    expect(fetchControlado).not.toHaveBeenCalled()
  })

  it('a demonstração não transmite senha nem token para abrir um perfil fictício', async () => {
    vi.stubEnv('VITE_USE_MSW', 'true')
    const fetchControlado = vi.fn().mockResolvedValue(Response.json({ usuario: { perfil: 'gestor' }, expiraEm: new Date().toISOString() }))
    vi.stubGlobal('fetch', fetchControlado)
    const { abrirDemonstracao } = await import('../src/services/authService')
    await abrirDemonstracao('gestor')
    expect(fetchControlado.mock.calls[0][0]).toMatch(/\/auth\/demo$/)
    expect(JSON.parse(fetchControlado.mock.calls[0][1].body)).toEqual({ perfil: 'gestor' })
    expect(fetchControlado.mock.calls[0][1].headers.Authorization).toBeUndefined()
  })
})
