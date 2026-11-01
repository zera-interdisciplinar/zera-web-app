import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { createWebServer, validateWebConfig } from '../server/web.mjs'

const servers: ReturnType<typeof createServer>[] = []
let directory: string
async function start(server: ReturnType<typeof createServer>) {
  servers.push(server)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}
beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'zera-web-'))
  await mkdir(join(directory, 'assets'))
  await writeFile(join(directory, 'index.html'), '<h1>Entrar</h1>')
  await writeFile(join(directory, 'assets', 'app-123.js'), 'export const loaded = true')
})
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()) })))
  await rm(directory, { recursive: true, force: true })
})
it('serves history routes and HEAD without caching the HTML, and caches built assets', async () => {
  const base = await start(createWebServer({ directory, config: {} }))
  const page = await fetch(`${base}/itens/item-1`, { headers: { Accept: 'text/html' } })
  expect(page.status).toBe(200)
  expect(await page.text()).toContain('Entrar')
  expect(page.headers.get('cache-control')).toBe('no-cache')
  expect(page.headers.get('x-content-type-options')).toBe('nosniff')
  const head = await fetch(`${base}/login`, { method: 'HEAD', headers: { Accept: 'text/html' } })
  expect(head.status).toBe(200)
  expect(await head.text()).toBe('')
  const asset = await fetch(`${base}/assets/app-123.js`)
  expect(asset.headers.get('content-type')).toContain('javascript')
  expect(asset.headers.get('cache-control')).toContain('immutable')
})
it('never falls back to HTML for API misses, assets, dotfiles or unsafe paths', async () => {
  const base = await start(createWebServer({ directory, config: {} }))
  for (const path of ['/api', '/api/unknown', '/assets/missing.js', '/.env', '/%2eenv', '/assets%5capp-123.js']) {
    const result = await fetch(`${base}${path}`, { headers: { Accept: 'text/html' } })
    expect(result.status).toBe(404)
    expect(await result.text()).not.toContain('Entrar')
  }
  expect((await fetch(`${base}/%ZZ`)).status).toBe(400)
  expect((await fetch(`${base}/login`, { method: 'POST' })).status).toBe(405)
  expect((await fetch(`${base}/healthz`)).status).toBe(200)
})
it('uses the allowlisted proxy on the same origin and keeps the gateway key on the server', async () => {
  const key = crypto.randomUUID()
  const upstream = await start(createServer((req, res) => {
    expect(req.url).toBe('/qa/administrative/api/v1/auth/login')
    expect(req.headers.apikey).toBe(key)
    res.writeHead(401, { 'Content-Type': 'application/json' }); res.end('{"message":"invalid"}')
  }))
  const base = await start(createWebServer({ directory, config: { administrative: `${upstream}/qa/administrative`, apiKey: key } }))
  const result = await fetch(`${base}/api/administrative/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  expect(result.status).toBe(401)
  expect(await result.text()).toBe('{"message":"invalid"}')
  expect(result.headers.get('apikey')).toBeNull()
})
it('fails before listening when runtime credentials or origins are missing or insecure', () => {
  const env = { ZERA_APP_API_KEY: 'test', ZERA_ADMIN_URL: 'https://api.example.invalid/admin', ZERA_INVENTORY_URL: 'https://api.example.invalid/inventory', ZERA_ANALYTICS_URL: 'https://api.example.invalid/analytics', ZERA_WEB_ORIGINS: 'https://gestao.example.invalid' }
  expect(validateWebConfig(env).apiKey).toBe('test')
  expect(() => validateWebConfig({ ...env, ZERA_APP_API_KEY: '' })).toThrow()
  expect(() => validateWebConfig({ ...env, ZERA_WEB_ORIGINS: '' })).toThrow()
  expect(() => validateWebConfig({ ...env, ZERA_ADMIN_URL: 'http://api.example.invalid' })).toThrow()
  expect(() => validateWebConfig({ ...env, ZERA_WEB_ORIGINS: 'https://gestao.example.invalid/path' })).toThrow()
  expect(() => validateWebConfig({ ...env, ZERA_WEB_ORIGINS: 'ftp://localhost' })).toThrow()
})
