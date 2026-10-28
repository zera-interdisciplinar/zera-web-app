import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatarDataRelativa } from '../src/utils/formatacao'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

describe('regressões de usabilidade', () => {
  it('interpreta o timestamp sem offset como UTC, como o timestamp com Z', () => {
    const referencia = new Date('2026-10-28T15:00:00Z')
    expect(formatarDataRelativa('2026-10-28T14:12:00', referencia)).toBe(formatarDataRelativa('2026-10-28T14:12:00Z', referencia))
  })
  it('recusa lista truncada mesmo quando totalPages diz que terminou', async () => {
    vi.stubEnv('VITE_USE_MSW', 'false')
    vi.stubEnv('VITE_INVENTORY_API_URL', 'https://inventory.example.invalid')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ content: [{ id: 'a' }], page: 0, size: 20, totalElements: 12, totalPages: 1 })))
    const { definirSessaoApi, listarPaginas } = await import('../src/services/apiReal')
    definirSessaoApi('teste', 'unidade')
    await expect(listarPaginas('inventory', '/api/v1/models')).rejects.toThrow()
  })
})
