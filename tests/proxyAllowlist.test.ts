import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { ALLOWED_ROUTES, isAllowedRoute } from '../server/allowlist.mjs'
import { createProxy } from '../server/proxy.mjs'

type Contract = { paths: Record<string, Record<string, unknown>> }
const read = (name: string) => JSON.parse(readFileSync(new URL(`./fixtures/openapi/${name}.json`, import.meta.url), 'utf8')) as Contract
const contracts = { administrative: read('administrative'), inventory: read('inventory') }
const toRegex = (template: string) => new RegExp(`^${template.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\\?\{[^}]+\}/g, '[^/]+')}$`)

describe('allowlist x OpenAPI contract (QA, 2026-10-31)', () => {
  const rows = (['administrative', 'inventory'] as const).flatMap((service) =>
    Object.entries(ALLOWED_ROUTES[service]).flatMap(([method, routes]) => routes.map((route) => [service, method, route] as const)))

  it.each(rows)('%s %s %s exists in the contract', (service, method, route) => {
    const operations = contracts[service].paths[route.replace('{id}', '{id}')]
      ?? Object.entries(contracts[service].paths).find(([path]) => toRegex(path).test(route.replace('{id}', 'x')))?.[1]
    expect(operations, `${route} is not in the ${service} contract`).toBeDefined()
    expect(Object.keys(operations as object).map((m) => m.toUpperCase()), `${method} ${route}`).toContain(method)
  })

  it('keeps analytics limited to the two documented read routes', () => {
    expect(ALLOWED_ROUTES.analytics).toEqual({ GET: ['/health', '/api/v1/dashboard/overview'] })
  })
})

describe('allowlist decisions', () => {
  it.each([
    ['administrative', 'POST', '/api/v1/auth/login'],
    ['administrative', 'GET', '/api/v1/users/3f2a-uuid'],
    ['inventory', 'GET', '/api/v1/items'],
    ['inventory', 'GET', '/api/v1/items/3f2a/events'],
    ['inventory', 'POST', '/api/v1/items/3f2a/approve'],
    ['inventory', 'PATCH', '/api/v1/models/3f2a/materials'],
    ['inventory', 'PUT', '/api/v1/unit-settings'],
    ['inventory', 'DELETE', '/api/v1/categories/3f2a'],
    ['analytics', 'GET', '/api/v1/dashboard/overview'],
  ])('allows %s %s %s', (service, method, path) => {
    expect(isAllowedRoute(service, method, path)).toBe(true)
  })

  it.each([
    // Business rules BR-03, BR-04 and X-8: never reachable from the web.
    ['administrative', 'GET', '/api/v1/recycling-places'],
    ['administrative', 'GET', '/api/v1/users'],
    ['administrative', 'POST', '/api/v1/users'],
    ['administrative', 'GET', '/api/v1/recyclings'],
    ['inventory', 'GET', '/api/v1/disposals'],
    ['inventory', 'POST', '/api/v1/disposals'],
    ['inventory', 'PATCH', '/api/v1/disposals/3f2a/cancel'],
    ['inventory', 'GET', '/api/v1/disposals/3f2a/report'],
    ['inventory', 'GET', '/api/v1/rules'],
    ['inventory', 'POST', '/api/v1/items/3f2a/photo'],
    ['inventory', 'POST', '/api/v1/items/3f2a/lend'],
    ['inventory', 'POST', '/api/v1/items/3f2a/return'],
    ['inventory', 'POST', '/api/v1/items/3f2a/maintenance/start'],
    ['inventory', 'POST', '/api/v1/items/3f2a/evaluate'],
    ['inventory', 'PATCH', '/api/v1/items/3f2a/status'],
    ['inventory', 'PATCH', '/api/v1/items/3f2a/unit'],
    ['inventory', 'GET', '/api/v1/items/by-barcode/123'],
    ['inventory', 'GET', '/api/v1/dashboard/home'],
    // Wrong method, other services and traversal attempts.
    ['inventory', 'DELETE', '/api/v1/unit-settings'],
    ['analytics', 'POST', '/api/v1/dashboard/overview'],
    ['analytics', 'GET', '/api/v1/dashboard/other'],
    ['inventory', 'GET', '/api/v1/items/../disposals'],
    ['inventory', 'GET', '/api/v1/items/3f2a/events/extra'],
    ['unknown', 'GET', '/api/v1/items'],
  ])('refuses %s %s %s', (service, method, path) => {
    expect(isAllowedRoute(service, method, path)).toBe(false)
  })
})

describe('proxy answers 404 to routes outside the allowlist', () => {
  const servers: ReturnType<typeof createServer>[] = []
  afterEach(async () => { await Promise.all(servers.splice(0).map((s) => new Promise<void>((r) => { s.closeAllConnections(); s.close(() => r()) }))) })

  it('never reaches the upstream for forbidden routes', async () => {
    let hits = 0
    const upstream = createServer((_req, res) => { hits += 1; res.writeHead(200); res.end('{}') })
    const proxyServer = createServer(createProxy({ administrative: 'http://127.0.0.1:1', inventory: 'http://127.0.0.1:1', apiKey: 'k' }))
    servers.push(upstream, proxyServer)
    await Promise.all([upstream, proxyServer].map((s) => new Promise<void>((r) => s.listen(0, '127.0.0.1', r))))
    const base = `http://127.0.0.1:${(proxyServer.address() as AddressInfo).port}`
    for (const [method, path] of [
      ['GET', '/api/administrative/api/v1/recycling-places?lat=1&lng=1'],
      ['POST', '/api/inventory/api/v1/disposals'],
      ['GET', '/api/inventory/api/v1/disposals'],
      ['POST', '/api/inventory/api/v1/items/x/lend'],
    ]) expect((await fetch(`${base}${path}`, { method })).status, `${method} ${path}`).toBe(404)
    expect(hits).toBe(0)
  })
})
