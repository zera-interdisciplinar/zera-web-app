import { createServer, request as httpRequest } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createProxy } from '../server/proxy.mjs'
import { proxyConfig, parseProxyPort } from '../server/config.mjs'

const servers: ReturnType<typeof createServer>[] = []

async function start(handler: Parameters<typeof createServer>[0]): Promise<string> {
  const server = createServer(handler)
  servers.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()) })))
  vi.unstubAllEnvs()
})

describe('proxy configuration', () => {
  it('uses the default port when empty and rejects invalid ports', () => {
    expect(parseProxyPort('')).toBe(8787)
    expect(parseProxyPort(undefined)).toBe(8787)
    expect(parseProxyPort('18787')).toBe(18787)
    for (const value of ['0', '65536', 'abc', '8080.5']) expect(() => parseProxyPort(value)).toThrow('Invalid proxy port')
  })

  it('prefers the canonical variable names and keeps the legacy aliases working', () => {
    expect(proxyConfig({ ZERA_ADMIN_URL: 'https://admin.example.invalid', ZERA_ADMIN_API_ORIGIN: 'https://old.example.invalid' }).administrative).toBe('https://admin.example.invalid')
    expect(proxyConfig({ ZERA_ADMIN_API_ORIGIN: 'https://old.example.invalid' }).administrative).toBe('https://old.example.invalid')
    expect(proxyConfig({ ZERA_INVENTORY_URL: 'https://inventory.example.invalid', ZERA_INVENTORY_API_ORIGIN: 'https://old.example.invalid' }).inventory).toBe('https://inventory.example.invalid')
    expect(proxyConfig({ ZERA_INVENTORY_API_ORIGIN: 'https://old.example.invalid' }).inventory).toBe('https://old.example.invalid')
  })
})

describe('forwarding', () => {
  it.each([401, 503])('preserves the HTTP %s of the login and injects the key without exposing it', async (status) => {
    const key = crypto.randomUUID()
    const upstream = await start(async (req, res) => {
      expect(req.method).toBe('POST')
      expect(req.url).toBe('/qa/administrative/api/v1/auth/login')
      expect(req.headers.apikey).toBe(key)
      let body = ''
      for await (const chunk of req) body += chunk
      expect(Object.keys(JSON.parse(body))).toEqual(['email', 'password'])
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end('{"message":"controlled failure","request_id":"test"}')
    })
    const proxy = await start(createProxy({ administrative: `${upstream}/qa/administrative`, apiKey: key }))
    const response = await fetch(`${proxy}/api/administrative/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apiKey: 'client-value-is-ignored' },
      body: JSON.stringify({ email: 'test@example.invalid', password: crypto.randomUUID() }),
    })
    expect(response.status).toBe(status)
    expect(await response.text()).not.toContain(key)
  })

  it('keeps the JWT and the unit header and writes through the allowlisted methods', async () => {
    const key = crypto.randomUUID()
    const seen: string[] = []
    const upstream = await start((req, res) => {
      seen.push(`${req.method} ${req.url}`)
      expect(req.headers.apikey).toBe(key)
      expect(req.headers.authorization).toBe('Bearer token-under-test')
      expect(req.headers['x-unit-id']).toBe('unit-under-test')
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end('{}')
    })
    const proxy = await start(createProxy({ inventory: `${upstream}/qa/inventory`, apiKey: key }))
    const headers = { Authorization: 'Bearer token-under-test', 'X-Unit-Id': 'unit-under-test', 'Content-Type': 'application/json' }
    for (const [method, path] of [
      ['GET', '/api/v1/items?page=0'], ['POST', '/api/v1/items'], ['POST', '/api/v1/items/abc/submit'],
      ['PATCH', '/api/v1/items/abc'], ['PUT', '/api/v1/unit-settings'], ['DELETE', '/api/v1/items/abc'],
    ]) {
      const response = await fetch(`${proxy}/api/inventory${path}`, { method, headers, body: method === 'GET' || method === 'DELETE' ? undefined : '{}' })
      expect(response.status, `${method} ${path}`).toBe(200)
    }
    expect(seen).toEqual([
      'GET /qa/inventory/api/v1/items?page=0', 'POST /qa/inventory/api/v1/items', 'POST /qa/inventory/api/v1/items/abc/submit',
      'PATCH /qa/inventory/api/v1/items/abc', 'PUT /qa/inventory/api/v1/unit-settings', 'DELETE /qa/inventory/api/v1/items/abc',
    ])
  })

  it('serves SSE before the response ends and cancels the upstream on exit', async () => {
    const key = crypto.randomUUID()
    let disconnected = false
    const upstream = await start((req, res) => {
      expect(req.url).toBe('/qa/analytics/api/v1/dashboard/overview?period=6m')
      expect(req.headers.apikey).toBe(key)
      expect(req.headers.accept).toBe('text/event-stream')
      expect(req.headers.authorization).toBe('Bearer jwt-under-test')
      res.once('close', () => { disconnected = true })
      res.writeHead(200, { 'Content-Type': 'text/event-stream' })
      res.write('event: unavailable\ndata: {"detail":"snapshot not ready"}\n\n')
    })
    const proxy = await start(createProxy({ analytics: `${upstream}/qa/analytics`, apiKey: key }))
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)
    try {
      const response = await fetch(`${proxy}/api/analytics/api/v1/dashboard/overview?period=6m`, { headers: { Authorization: 'Bearer jwt-under-test' }, signal: controller.signal })
      expect(response.headers.get('x-accel-buffering')).toBe('no')
      expect(response.headers.get('cache-control')).toContain('no-transform')
      const reader = response.body!.getReader()
      expect(new TextDecoder().decode((await reader.read()).value)).toContain('event: unavailable')
      expect(disconnected).toBe(false)
      await reader.cancel()
      await vi.waitFor(() => expect(disconnected).toBe(true))
    } finally { clearTimeout(timeout); controller.abort() }
  })
})

describe('refusals', () => {
  it('refuses the token in the query and analytics writes', async () => {
    const proxy = await start(createProxy({ apiKey: crypto.randomUUID() }))
    expect((await fetch(`${proxy}/api/analytics/api/v1/dashboard/overview?access_token=do-not-forward`)).status).toBe(400)
    expect((await fetch(`${proxy}/api/inventory/api/v1/items?access_token=do-not-forward`)).status).toBe(400)
    expect((await fetch(`${proxy}/api/analytics/api/v1/dashboard/overview`, { method: 'POST' })).status).toBe(404)
    expect((await fetch(`${proxy}/api/analytics/api/v1/dashboard/overview`)).status).toBe(503)
  })

  it('refuses unauthorized origins and arbitrary destinations', async () => {
    const proxy = await start(createProxy({ apiKey: crypto.randomUUID() }))
    expect((await fetch(`${proxy}/inventory/api/v1/items`, { headers: { Origin: 'https://other.example.invalid' } })).status).toBe(403)
    expect((await fetch(`${proxy}/https://other.example.invalid`)).status).toBe(404)
  })

  it('refuses remote HTTP without transmitting the key', async () => {
    const proxy = await start(createProxy({ inventory: 'http://remote.example.invalid', apiKey: crypto.randomUUID() }))
    const response = await fetch(`${proxy}/inventory/api/v1/items`)
    expect(response.status).toBe(502)
    expect(await response.text()).toContain('Não foi possível')
  })

  it('ignores a body sent with GET instead of failing', async () => {
    const upstream = await start((req, res) => { res.writeHead(req.headers['content-length'] ? 400 : 200); res.end('{}') })
    const proxy = await start(createProxy({ inventory: upstream, apiKey: crypto.randomUUID() }))
    const status = await new Promise<number>((resolve, reject) => {
      const request = httpRequest(`${proxy}/api/inventory/api/v1/items`, { method: 'GET', headers: { 'Content-Type': 'application/json', 'Content-Length': 2 } }, (response) => { response.resume(); resolve(response.statusCode ?? 0) })
      request.on('error', reject)
      request.end('{}')
    })
    expect(status).toBe(200)
  })

  it('refuses bodies above 64 KB', async () => {
    const upstream = await start((_req, res) => { res.writeHead(200); res.end('{}') })
    const proxy = await start(createProxy({ inventory: upstream, apiKey: crypto.randomUUID() }))
    const response = await fetch(`${proxy}/api/inventory/api/v1/items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: 'x'.repeat(70 * 1024) }) })
    expect(response.status).toBe(413)
  })

  it('answers 400 for a malformed URL', async () => {
    const handler = createProxy({ apiKey: crypto.randomUUID() })
    const res = { setHeader: () => {}, writeHead: (status: number) => { expect(status).toBe(400) }, end: () => {} }
    await handler({ url: 'http://[', headers: {}, method: 'GET' } as never, res as never)
  })
})
