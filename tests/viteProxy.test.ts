import { createServer as criarServidorHttp } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, expect, it, vi } from 'vitest'
import { createServer, type ViteDevServer } from 'vite'

let vite: ViteDevServer | undefined
let upstream: ReturnType<typeof criarServidorHttp> | undefined

afterEach(async () => {
  await vite?.close()
  if (upstream) await new Promise<void>((resolve) => { upstream!.closeAllConnections(); upstream!.close(() => resolve()) })
  vi.unstubAllEnvs()
})

it('Vite encaminha login, inventário e SSE com chave privada usando somente servidores locais', async () => {
  const key = crypto.randomUUID()
  const chamadas: string[] = []
  upstream = criarServidorHttp((req, res) => {
    chamadas.push(req.url ?? '')
    expect(req.headers.apikey).toBe(key)
    if (req.url?.includes('/analytics/')) {
      expect(req.headers.authorization).toBe('Bearer jwt-local')
      res.writeHead(200, { 'Content-Type': 'text/event-stream' })
      res.write('event: unavailable\ndata: {"detail":"snapshot not ready"}\n\n')
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end('{}')
    }
  })
  await new Promise<void>((resolve) => upstream!.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${(upstream.address() as AddressInfo).port}/qa`
  vi.stubEnv('ZERA_APP_API_KEY', key)
  vi.stubEnv('ZERA_ADMIN_URL', `${base}/administrative`)
  vi.stubEnv('ZERA_INVENTORY_API_ORIGIN', `${base}/inventory`)
  vi.stubEnv('ZERA_ANALYTICS_URL', `${base}/analytics`)
  vite = await createServer({
    configFile: 'vite.config.ts', mode: 'test',
    server: { host: '127.0.0.1', port: 0, strictPort: false, hmr: false, watch: null },
  })
  await vite.listen()
  const url = `http://127.0.0.1:${(vite.httpServer!.address() as AddressInfo).port}`
  expect((await fetch(`${url}/api/administrative/api/v1/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teste@example.invalid', password: crypto.randomUUID() }),
  })).status).toBe(200)
  expect((await fetch(`${url}/api/inventory/api/v1/items`)).status).toBe(200)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 2000)
  try {
    const response = await fetch(`${url}/api/analytics/api/v1/dashboard/overview?period=6m`, {
      signal: controller.signal, headers: { Authorization: 'Bearer jwt-local' },
    })
    expect(response.headers.get('x-accel-buffering')).toBe('no')
    const reader = response.body!.getReader()
    expect(new TextDecoder().decode((await reader.read()).value)).toContain('event: unavailable')
    await reader.cancel()
  } finally { clearTimeout(timeout); controller.abort() }
  expect(chamadas).toEqual([
    '/qa/administrative/api/v1/auth/login',
    '/qa/inventory/api/v1/items',
    '/qa/analytics/api/v1/dashboard/overview?period=6m',
  ])
}, 20_000)
