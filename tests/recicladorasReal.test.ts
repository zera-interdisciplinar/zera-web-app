import { afterEach, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })
const empresa = { id: 'empresa', name: 'Recicladora sintética', cnpj: '12.345.678/0001-90', email: 'contato@example.invalid', placeId: null }

async function preparar(corpo: unknown) {
  vi.stubEnv('VITE_USE_MSW', 'false')
  vi.stubEnv('VITE_ADMIN_API_URL', 'https://administrative.example.invalid')
  const fetch = vi.fn().mockResolvedValue(Response.json(corpo))
  vi.stubGlobal('fetch', fetch)
  const { definirSessaoApi } = await import('../src/services/apiReal')
  definirSessaoApi('sessao-sintetica', 'unidade')
  return { fetch, servico: await import('../src/services/relatorioService') }
}

it('lista empresas pelo contrato administrativo atual, separado da busca geográfica', async () => {
  const { fetch, servico } = await preparar([empresa])
  expect(await servico.listarRecicladoras()).toMatchObject([{ id: 'empresa', nome: 'Recicladora sintética', email: 'contato@example.invalid' }])
  expect(fetch.mock.calls[0][0].pathname).toBe('/api/v1/recyclings')
})

it('envia somente name, cnpj e email no cadastro real, sem cidade ou credenciais', async () => {
  const { fetch, servico } = await preparar(empresa)
  await servico.criarRecicladora({ nome: empresa.name, cnpj: empresa.cnpj, email: empresa.email, cidade: '' })
  expect(fetch.mock.calls[0][0].pathname).toBe('/api/v1/recyclings')
  expect(fetch.mock.calls[0][1].method).toBe('POST')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ name: empresa.name, cnpj: empresa.cnpj, email: empresa.email })
})

it('não transforma uma resposta inesperada de empresas em lista vazia', async () => {
  const { servico } = await preparar({ content: [] })
  await expect(servico.listarRecicladoras()).rejects.toThrow()
})
