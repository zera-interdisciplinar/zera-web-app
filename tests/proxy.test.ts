import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { criarProxy } from '../server/proxy.mjs'
import analyticsHandler from '../api/proxy'
import { configuracaoProxy, portaProxy, restaurarCaminhoProxy } from '../server/config.mjs'
import { readFileSync } from 'node:fs'

const servidores: ReturnType<typeof createServer>[] = []
function jwt(userId: string, role: 'EMPLOYEE' | 'MANAGER'): string {
  const payload = Buffer.from(JSON.stringify({ sub: userId, role })).toString('base64url')
  return `e30.${payload}.assinatura-de-teste`
}
it('usa a porta padrão quando a configuração está vazia e rejeita portas inválidas', () => {
  expect(portaProxy('')).toBe(8787)
  expect(portaProxy(undefined)).toBe(8787)
  expect(portaProxy('18787')).toBe(18787)
  for (const valor of ['0', '65536', 'abc', '8080.5']) expect(() => portaProxy(valor)).toThrow('Porta de proxy inválida')
})
async function iniciar(handler: Parameters<typeof createServer>[0]): Promise<string> {
  const server = createServer(handler)
  servidores.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}
afterEach(async () => {
  await Promise.all(servidores.splice(0).map((server) => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()) })))
  vi.unstubAllEnvs()
})

describe('proxy de aplicação', () => {
  it('encaminha os caminhos profundos por rewrite explícito na Vercel', async () => {
    const deployment = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
    expect(deployment.rewrites).toContainEqual({ source: '/api/:service(administrative|inventory|analytics)/:path*', destination: '/api/proxy?__zera_service=:service&__zera_path=:path*' })
  })
  it('restaura o destino do rewrite, preserva filtros e recusa destinos injetados', async () => {
    const upstream = await iniciar((req, res) => {
      expect(req.url).toBe('/api/v1/models?page=2&size=20')
      res.writeHead(200); res.end('{}')
    })
    vi.stubEnv('ZERA_INVENTORY_API_ORIGIN', upstream)
    vi.stubEnv('ZERA_APP_API_KEY', crypto.randomUUID())
    const proxy = await iniciar(analyticsHandler)
    expect((await fetch(`${proxy}/api/proxy?__zera_service=inventory&__zera_path=api%2Fv1%2Fmodels&page=2&size=20`)).status).toBe(200)
    expect((await fetch(`${proxy}/api/proxy?__zera_service=https%3A%2F%2Fevil.invalid&__zera_path=health`)).status).toBe(404)
    expect((await fetch(`${proxy}/api/proxy?__zera_service=inventory&__zera_service=analytics&__zera_path=health`)).status).toBe(404)
    const query = new URLSearchParams({ __zera_service: 'inventory', __zera_path: 'api/v1/items/by-barcode/A%2FB' })
    expect(restaurarCaminhoProxy(`/api/proxy?${query}`)).toBe('/api/inventory/api/v1/items/by-barcode/A%2FB')
  })
  it('usa nomes privados canônicos e mantém compatibilidade com a base administrativa anterior', () => {
    expect(configuracaoProxy({ ZERA_ADMIN_URL: 'https://admin.example.invalid', ZERA_ADMIN_API_ORIGIN: 'https://old.example.invalid' }).administrative).toBe('https://admin.example.invalid')
  })

  it.each([401, 503])('preserva HTTP %s do login e injeta apiKey sem expor seu valor', async (status) => {
    const key = crypto.randomUUID()
    const upstream = await iniciar(async (req, res) => {
      expect(req.method).toBe('POST')
      expect(req.url).toBe('/qa/administrative/api/v1/auth/login')
      expect(req.headers.apikey).toBe(key)
      let corpo = ''
      for await (const chunk of req) corpo += chunk
      expect(Object.keys(JSON.parse(corpo))).toEqual(['email', 'password'])
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end('{"message":"falha controlada","request_id":"teste"}')
    })
    const proxy = await iniciar(criarProxy({ administrative: `${upstream}/qa/administrative`, apiKey: key }))
    const response = await fetch(`${proxy}/api/administrative/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apiKey: 'valor-do-cliente-ignorado' },
      body: JSON.stringify({ email: 'teste@example.invalid', password: crypto.randomUUID() }),
    })
    expect(response.status).toBe(status)
    expect(await response.text()).not.toContain(key)
  })

  it('entrega SSE pela função Vercel antes do fim da resposta e cancela o upstream ao sair', async () => {
    const key = crypto.randomUUID()
    let desconectou = false
    const upstream = await iniciar((req, res) => {
      expect(req.url).toBe('/qa/analytics/api/v1/dashboard/overview?period=6m')
      expect(req.headers.apikey).toBe(key)
      expect(req.headers.accept).toBe('text/event-stream')
      expect(req.headers.authorization).toBe('Bearer jwt-de-teste')
      res.once('close', () => { desconectou = true })
      res.writeHead(200, { 'Content-Type': 'text/event-stream' })
      res.write('event: unavailable\ndata: {"detail":"snapshot not ready"}\n\n')
    })
    vi.stubEnv('ZERA_ANALYTICS_URL', `${upstream}/qa/analytics`)
    vi.stubEnv('ZERA_APP_API_KEY', key)
    const proxy = await iniciar(analyticsHandler)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    try {
      const response = await fetch(`${proxy}/api/analytics/api/v1/dashboard/overview?period=6m`, { headers: { Authorization: 'Bearer jwt-de-teste' }, signal: controller.signal })
      expect(response.headers.get('x-accel-buffering')).toBe('no')
      expect(response.headers.get('cache-control')).toContain('no-transform')
      const reader = response.body!.getReader()
      const chunk = await reader.read()
      expect(new TextDecoder().decode(chunk.value)).toContain('event: unavailable')
      expect(desconectou).toBe(false)
      await reader.cancel()
      await vi.waitFor(() => expect(desconectou).toBe(true))
    } finally { clearTimeout(timeout); controller.abort() }
  })

  it('não encaminha token na query nem escrita para analytics', async () => {
    const proxy = await iniciar(criarProxy({ apiKey: crypto.randomUUID() }))
    expect((await fetch(`${proxy}/api/analytics/api/v1/dashboard/overview?access_token=nao-enviar`)).status).toBe(400)
    expect((await fetch(`${proxy}/api/analytics/api/v1/dashboard/overview`, { method: 'POST' })).status).toBe(404)
    expect((await fetch(`${proxy}/api/analytics/api/v1/dashboard/overview`)).status).toBe(503)
  })

  it('injeta a chave somente no servidor e preserva JWT e unidade', async () => {
    const key = crypto.randomUUID()
    const token = jwt('gestor-teste', 'MANAGER')
    const upstream = await iniciar((req, res) => {
      expect(req.url).toBe('/qa/inventory/api/v1/items?page=0')
      expect(req.headers.apikey).toBe(key)
      expect(req.headers.authorization).toBe(`Bearer ${token}`)
      expect(req.headers['x-unit-id']).toBe('unidade-teste')
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{"content":[]}')
    })
    const proxy = await iniciar(criarProxy({ inventory: `${upstream}/qa/inventory`, apiKey: key }))
    const response = await fetch(`${proxy}/inventory/api/v1/items?page=0`, { headers: { Authorization: `Bearer ${token}`, 'X-Unit-Id': 'unidade-teste' } })
    expect(response.status).toBe(200)
    expect(await response.text()).not.toContain(key)
  })
  it('filtra a lista do Operário e oculta por id e código de barras itens de outra pessoa', async () => {
    const idOperario = 'operario-teste'
    const token = jwt(idOperario, 'EMPLOYEE')
    const consultas: string[] = []
    const upstream = await iniciar((req, res) => {
      const caminho = req.url ?? ''
      consultas.push(caminho)
      if (caminho.startsWith('/api/v1/items?')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end('{"content":[],"page":0,"size":20,"totalElements":0,"totalPages":0}')
        return
      }
      if (caminho.endsWith('/item-de-outra-pessoa') || caminho.endsWith('/by-barcode/codigo-alheio')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end('{"id":"item-teste","createdBy":"outro-operario"}')
        return
      }
      if (caminho.endsWith('/item-do-operario')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(`{"id":"item-teste","createdBy":"${idOperario}"}`)
        return
      }
      res.writeHead(404); res.end()
    })
    const proxy = await iniciar(criarProxy({ inventory: upstream, apiKey: crypto.randomUUID() }))
    const headers = { Authorization: `Bearer ${token}`, 'X-Unit-Id': 'unidade-teste' }
    const lista = await fetch(`${proxy}/inventory/api/v1/items?page=0&size=20`, { headers })
    expect(lista.status).toBe(200)
    expect(new URL(`http://localhost${consultas[0]}`).searchParams.get('createdBy')).toBe(idOperario)
    expect((await fetch(`${proxy}/inventory/api/v1/items/item-de-outra-pessoa`, { headers })).status).toBe(404)
    expect((await fetch(`${proxy}/inventory/api/v1/items/by-barcode/codigo-alheio`, { headers })).status).toBe(404)
    const proprio = await fetch(`${proxy}/inventory/api/v1/items/item-do-operario`, { headers })
    expect(proprio.status).toBe(200)
    expect((await proprio.json()).createdBy).toBe(idOperario)
  })
  it('mantém sem filtro as consultas do Gestor', async () => {
    const original = '/api/v1/items?page=2&size=20'
    const upstream = await iniciar((req, res) => {
      expect(req.url).toBe(original)
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{"content":[],"page":2,"size":20,"totalElements":0,"totalPages":0}')
    })
    const proxy = await iniciar(criarProxy({ inventory: upstream, apiKey: crypto.randomUUID() }))
    const token = jwt('gestor-teste', 'MANAGER')
    const response = await fetch(`${proxy}/inventory${original}`, { headers: { Authorization: `Bearer ${token}` } })
    expect(response.status).toBe(200)
  })
  it('recusa origem não autorizada e destinos arbitrários', async () => {
    const proxy = await iniciar(criarProxy({ apiKey: crypto.randomUUID() }))
    expect((await fetch(`${proxy}/inventory/api/v1/items`, { headers: { Origin: 'https://other.example.invalid' } })).status).toBe(403)
    expect((await fetch(`${proxy}/https://other.example.invalid`)).status).toBe(404)
  })
  it('recusa HTTP remoto sem transmitir a chave', async () => {
    const proxy = await iniciar(criarProxy({ inventory: 'http://remote.example.invalid', apiKey: crypto.randomUUID() }))
    const response = await fetch(`${proxy}/inventory/api/v1/items`)
    expect(response.status).toBe(502)
    expect(await response.text()).toContain('Não foi possível')
  })
})

it('encaminha etiquetas codificadas sem alterar o segmento', async () => {
  const upstream = await iniciar((req, res) => {
    expect(req.url).toBe('/api/v1/items/by-barcode/A%2FB')
    res.writeHead(200); res.end('{}')
  })
  const proxy = await iniciar(criarProxy({ inventory: upstream, apiKey: crypto.randomUUID() }))
  expect((await fetch(`${proxy}/inventory/api/v1/items/by-barcode/A%2FB`)).status).toBe(200)
})

it('responde 400 para uma URL malformada', async () => {
  const handler = criarProxy({ apiKey: crypto.randomUUID() })
  const res = { setHeader: () => {}, writeHead: (status: number) => { expect(status).toBe(400) }, end: () => {} }
  await handler({ url: 'http://[', headers: {}, method: 'GET' }, res)
})
