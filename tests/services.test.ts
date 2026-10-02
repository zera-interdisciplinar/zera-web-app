import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let busca: ReturnType<typeof vi.fn>
beforeEach(async () => {
  vi.stubEnv('VITE_USE_MSW', 'false')
  vi.stubEnv('VITE_INVENTORY_API_URL', 'https://inventory.example.invalid')
  vi.stubEnv('VITE_ADMIN_API_URL', 'https://admin.example.invalid')
  busca = vi.fn()
  vi.stubGlobal('fetch', busca)
  const { definirSessaoApi } = await import('../src/services/apiReal')
  definirSessaoApi(crypto.randomUUID(), crypto.randomUUID())
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

describe('serviços e erros das APIs', () => {
  it.each([401, 403, 404, 409, 422, 500])('preserva HTTP %s no erro', async (status) => {
    busca.mockResolvedValue(new Response('{}', { status }))
    const { requisitarApiReal } = await import('../src/services/apiReal')
    await expect(requisitarApiReal('inventory', '/api/v1/items')).rejects.toMatchObject({ status })
  })
  it('propaga cancelamento sem convertê-lo em falha de rede', async () => {
    const abort = new DOMException('Cancelado', 'AbortError')
    busca.mockRejectedValue(abort)
    const { listarEventos } = await import('../src/services/cicloService')
    await expect(listarEventos('id', new AbortController().signal)).rejects.toBe(abort)
  })
  it('informa erro de conexão', async () => {
    busca.mockRejectedValue(new TypeError('Network error'))
    const { requisitarApiReal } = await import('../src/services/apiReal')
    await expect(requisitarApiReal('inventory', '/api/v1/items')).rejects.toMatchObject({ status: 0 })
  })
  it('recusa resposta JSON inválida', async () => {
    busca.mockResolvedValue(new Response('<html/>'))
    const { requisitarApiReal } = await import('../src/services/apiReal')
    await expect(requisitarApiReal('inventory', '/api/v1/items')).rejects.toThrow('resposta inválida')
  })
  it('não chama a rede sem unidade ou sessão', async () => {
    const { definirSessaoApi, requisitarApiReal } = await import('../src/services/apiReal')
    definirSessaoApi(null, null)
    await expect(requisitarApiReal('inventory', '/api/v1/items')).rejects.toMatchObject({ status: 401 })
    definirSessaoApi(crypto.randomUUID(), null)
    await expect(requisitarApiReal('inventory', '/api/v1/items', { unidade: true })).rejects.toThrow('unidade')
    expect(busca).not.toHaveBeenCalled()
  })
  it('pagina eventos com os cabeçalhos e o sinal exigidos', async () => {
    busca.mockImplementation(async (url: URL) => new Response(JSON.stringify({ content: [{ id: url.searchParams.get('page') }], totalPages: 2 })))
    const { listarEventos } = await import('../src/services/cicloService')
    const sinal = new AbortController().signal
    expect(await listarEventos('item-id', sinal)).toHaveLength(2)
    const [url, opcoes] = busca.mock.calls[0]
    expect(url.pathname).toBe('/api/v1/items/item-id/events')
    expect(opcoes.headers).toHaveProperty('X-Unit-Id')
    expect(opcoes.headers).toHaveProperty('Authorization')
    expect(opcoes.signal).toBe(sinal)
    expect(opcoes.credentials).toBe('omit')
    expect(opcoes.redirect).toBe('error')
    expect(busca.mock.calls[1][0].searchParams.get('page')).toBe('1')
  })
  it('recusa paginação malformada', async () => {
    busca.mockResolvedValue(new Response(JSON.stringify({ content: {}, totalPages: -1 })))
    const { listarDescartes } = await import('../src/services/cicloService')
    await expect(listarDescartes()).rejects.toThrow('Paginação inválida')
  })
  it('consulta capacidade pelo endpoint documentado', async () => {
    busca.mockResolvedValue(new Response(JSON.stringify({ stockCapacity: 500, configured: true })))
    const { obterCapacidade } = await import('../src/services/cicloService')
    expect((await obterCapacidade()).stockCapacity).toBe(500)
    expect(busca.mock.calls[0][0].pathname).toBe('/api/v1/unit-settings')
  })
  it('cadastro de categoria envia somente campos do schema real', async () => {
    busca.mockResolvedValue(new Response(JSON.stringify({ id: 'categoria', name: 'Monitores', description: 'Telas', unitId: 'unidade' })))
    const { criarCategoria } = await import('../src/services/categoriaService')
    await criarCategoria({ nome: 'Monitores', descricao: 'Telas', diasLimiteDescarte: 90, exigeChecklistPericulosidade: false })
    expect(busca.mock.calls[0][0].pathname).toBe('/api/v1/categories')
    expect(busca.mock.calls[0][1].method).toBe('POST')
    expect(JSON.parse(busca.mock.calls[0][1].body)).toEqual({ name: 'Monitores', description: 'Telas' })
  })
  it('edição usa PATCH e preserva notas quando o campo fica vazio', async () => {
    busca.mockResolvedValue(new Response(JSON.stringify({ id: 'item', name: 'Nome', status: 'IN_STOCK', barcode: 'etiqueta', condition: 'USED', createdAt: '2026-01-01', updatedAt: '2026-01-01', model: null })))
    const { editarItemReal } = await import('../src/services/produtoService')
    await editarItemReal('item', { name: 'Nome', condition: 'USED', notes: '' })
    expect(busca.mock.calls[0][1].method).toBe('PATCH')
    expect(JSON.parse(busca.mock.calls[0][1].body)).toEqual({ name: 'Nome', condition: 'USED' })
  })
  it('busca de etiqueta codifica o identificador sem criar outra operação', async () => {
    busca.mockResolvedValue(new Response(JSON.stringify({ id: 'item', name: 'Nome', status: 'IN_STOCK', barcode: 'A/B', condition: 'USED', createdAt: '2026-01-01', updatedAt: '2026-01-01', model: null })))
    const { buscarPorCodigo } = await import('../src/services/produtoService')
    expect((await buscarPorCodigo('A/B')).codigoBarras).toBe('A/B')
    expect(busca.mock.calls[0][0].pathname).toBe('/api/v1/items/by-barcode/A%2FB')
  })
  it('remove tags de dados retornados antes da renderização', async () => {
    busca.mockResolvedValue(new Response(JSON.stringify({ name: '<script>alert(1)</script>Computador' })))
    const { requisitarApiReal } = await import('../src/services/apiReal')
    expect(await requisitarApiReal('inventory', '/api/v1/items')).toEqual({ name: 'alert(1)Computador' })
  })
  it('nunca envia credenciais de uma API real nem mesmo por HTTP local', async () => {
    vi.stubEnv('VITE_ADMIN_API_URL', 'http://localhost:8080')
    vi.resetModules()
    const { requisitarApiReal } = await import('../src/services/apiReal')
    await expect(requisitarApiReal('administrative', '/api/v1/auth/login', { autenticada: false })).rejects.toThrow('sem HTTPS')
    expect(busca).not.toHaveBeenCalled()
  })
})
