import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'

export function criarProxy({ administrative, inventory, apiKey, origins = ['http://localhost:5173', 'http://127.0.0.1:5173'] }) {
  const bases = { administrative, inventory }
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    const origin = req.headers.origin
    if (origin && !origins.includes(origin)) { res.writeHead(403); res.end(); return }
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin') }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Unit-Id')
      res.writeHead(204); res.end(); return
    }
    const route = new URL(req.url ?? '/', 'http://localhost')
    const match = route.pathname.match(/^\/(administrative|inventory)(\/api\/v1\/[A-Za-z0-9/_-]+)$/)
    if (!match || !['GET', 'POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method ?? '')) {
      res.writeHead(404); res.end(); return
    }
    const base = bases[match[1]]
    if (!base || !apiKey) {
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ mensagem: 'O serviço ainda não foi configurado.' })); return
    }
    try {
      const url = new URL(`${base.replace(/\/$/, '')}${match[2]}${route.search}`)
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) throw new Error('Transporte inseguro')
      if (url.username || url.password) throw new Error('URL inválida')
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > 64 * 1024) { res.writeHead(413); res.end(); return }
        chunks.push(chunk)
      }
      const headers = { Accept: 'application/json', apikey: apiKey }
      for (const header of ['authorization', 'x-unit-id', 'content-type']) {
        const value = req.headers[header]
        if (typeof value === 'string') headers[header] = value
      }
      const abort = new AbortController()
      const cancel = () => { if (!res.writableEnded) abort.abort() }
      res.once('close', cancel)
      try {
        const response = await fetch(url, {
          method: req.method,
          headers,
          body: chunks.length ? Buffer.concat(chunks) : undefined,
          redirect: 'error',
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(15_000)]),
        })
        const contentType = response.headers.get('content-type')
        if (contentType) res.setHeader('Content-Type', contentType)
        res.writeHead(response.status)
        res.end(Buffer.from(await response.arrayBuffer()))
      } finally { res.off('close', cancel) }
    } catch {
      if (res.destroyed) return
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ mensagem: 'Não foi possível acessar o serviço do ZERA.' }))
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.loadEnvFile('.env') } catch (error) { if (error.code !== 'ENOENT') throw error }
  const port = Number(process.env.ZERA_PROXY_PORT ?? 8787)
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Porta de proxy inválida')
  const proxy = criarProxy({
    administrative: process.env.ZERA_ADMIN_API_ORIGIN,
    inventory: process.env.ZERA_INVENTORY_API_ORIGIN,
    apiKey: process.env.ZERA_APP_API_KEY,
    origins: (process.env.ZERA_WEB_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((value) => value.trim()),
  })
  createServer(proxy).listen(port, '127.0.0.1', () => process.stdout.write(`Proxy ZERA disponível em http://127.0.0.1:${port}\n`))
}
