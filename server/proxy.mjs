// Forwards allowlisted API calls (JSON and SSE) and injects the API key without exposing it.
import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { isAllowedRoute } from './allowlist.mjs'
import { isAllowedOrigin, parseProxyPort, proxyConfig, validateProxyBase } from './config.mjs'

const METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
const MAX_BODY_BYTES = 64 * 1024
const OPEN_TIMEOUT_MS = { analytics: 180_000, default: 15_000 }
const ROUTE_PATTERN = /^\/(?:api\/)?(administrative|inventory|analytics)(\/api\/v1\/[A-Za-z0-9/_.%~-]+|\/health)$/

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(body))
}

/**
 * @param {{ administrative?: string, inventory?: string, analytics?: string, apiKey?: string, origins?: string[] }} options
 * @returns {import('node:http').RequestListener}
 */
export function createProxy({ administrative, inventory, analytics, apiKey, origins = ['http://localhost:5173', 'http://127.0.0.1:5173'] }) {
  const bases = { administrative, inventory, analytics }
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    const origin = req.headers.origin
    if (!isAllowedOrigin(origin, req.headers.host, origins)) { res.writeHead(403); res.end(); return }
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin') }
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', `${METHODS.join(', ')}, OPTIONS`)
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Unit-Id')
      res.writeHead(204); res.end(); return
    }
    let route
    try { route = new URL(req.url ?? '/', 'http://localhost') }
    catch { res.writeHead(400); res.end(); return }
    const match = route.pathname.match(ROUTE_PATTERN)
    if (!match || !isAllowedRoute(match[1], req.method ?? '', match[2])) { res.writeHead(404); res.end(); return }
    const [, service, upstreamPath] = match
    if (route.searchParams.has('access_token')) {
      sendJson(res, 400, { detail: 'Send the JWT in the Authorization header, never in the URL.' }); return
    }
    const base = bases[service]
    if (!base || !apiKey) {
      sendJson(res, 503, { mensagem: 'O serviço ainda não foi configurado.' }); return
    }
    try {
      const url = new URL(`${validateProxyBase(base)}${upstreamPath}${route.search}`)
      const chunks = []
      let size = 0
      for await (const chunk of req) {
        size += chunk.length
        if (size > MAX_BODY_BYTES) { res.writeHead(413); res.end(); return }
        chunks.push(chunk)
      }
      const streaming = service === 'analytics' && upstreamPath !== '/health'
      const headers = { Accept: streaming ? 'text/event-stream' : 'application/json', apiKey }
      for (const header of ['authorization', 'x-unit-id', 'content-type']) {
        const value = req.headers[header]
        if (typeof value === 'string') headers[header] = value
      }
      const abort = new AbortController()
      const cancel = () => { if (!res.writableEnded) abort.abort() }
      res.once('close', cancel)
      // Limits the opening of the connection, not the life of the SSE stream: heartbeats may run for minutes.
      const timeout = setTimeout(() => abort.abort(), service === 'analytics' ? OPEN_TIMEOUT_MS.analytics : OPEN_TIMEOUT_MS.default)
      try {
        const response = await fetch(url, {
          method: req.method,
          headers,
          // fetch rejects bodies on GET; clients that send one by mistake must not turn into a 502.
          body: chunks.length && req.method !== 'GET' ? Buffer.concat(chunks) : undefined,
          redirect: 'error',
          signal: abort.signal,
        })
        clearTimeout(timeout)
        const contentType = response.headers.get('content-type')
        if (contentType) res.setHeader('Content-Type', contentType)
        if (contentType?.includes('text/event-stream')) {
          res.setHeader('Cache-Control', 'no-cache, no-transform')
          res.setHeader('X-Accel-Buffering', 'no')
        }
        res.writeHead(response.status)
        res.flushHeaders()
        if (response.body) await pipeline(Readable.fromWeb(response.body), res)
        else res.end()
      } finally { clearTimeout(timeout); res.off('close', cancel) }
    } catch {
      if (res.destroyed) return
      if (res.headersSent) { res.destroy(); return }
      sendJson(res, 502, { mensagem: 'Não foi possível acessar o serviço do ZERA.' })
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let env = {}
  for (const file of ['.env', '.env.local']) {
    try { env = { ...env, ...parseEnv(readFileSync(file, 'utf8')) } }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  env = { ...env, ...process.env }
  const port = parseProxyPort(env.ZERA_PROXY_PORT)
  const proxy = createProxy(proxyConfig(env))
  createServer(proxy).listen(port, '127.0.0.1', () => process.stdout.write(`Proxy ZERA disponível em http://127.0.0.1:${port}\n`))
}
