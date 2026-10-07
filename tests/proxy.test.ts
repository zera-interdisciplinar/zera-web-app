import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { criarProxy } from '../server/proxy.mjs'

const servidores: ReturnType<typeof createServer>[] = []
async function iniciar(handler: Parameters<typeof createServer>[0]): Promise<string> {
  const server = createServer(handler)
  servidores.push(server)
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`
}
afterEach(async () => {
  await Promise.all(servidores.splice(0).map((server) => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()) })))
})

describe('proxy de aplicação', () => {
  it('injeta a chave somente no servidor e preserva JWT e unidade', async () => {
    const key = crypto.randomUUID()
    const token = crypto.randomUUID()
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
