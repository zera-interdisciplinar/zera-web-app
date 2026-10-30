import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { setupServer } from 'msw/node'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())
afterEach(() => { server.resetHandlers(); vi.unstubAllEnvs(); vi.resetModules() })

describe('regressão de recicladoras da demonstração', () => {
  it('lista, cadastra e consulta novamente sem perder os registros existentes', async () => {
    vi.stubEnv('VITE_USE_MSW', 'true')
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:9000/api')
    const { handlers } = await import('./mocks/handlers')
    server.use(...handlers)
    const { listarRecicladoras, criarRecicladora } = await import('../src/services/relatorioService')
    const antes = await listarRecicladoras()
    const criada = await criarRecicladora({ nome: 'Recicladora de teste', cidade: 'São Paulo', cnpj: '12.345.678/0001-90', email: 'contato@example.invalid' })
    const depois = await listarRecicladoras()
    expect(depois).toHaveLength(antes.length + 1)
    expect(depois.some((recicladora) => recicladora.id === criada.id && recicladora.nome === 'Recicladora de teste')).toBe(true)
    for (const recicladora of antes) expect(depois).toContainEqual(recicladora)
  })
})
