// Production entrypoint: static SPA and the same allowlisted API proxy used locally.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { resolve, relative, extname, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { pipeline } from 'node:stream/promises'
import { createProxy } from './proxy.mjs'
import { proxyConfig, parseProxyPort, validateProxyBase } from './config.mjs'

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' }

export function validateWebConfig(env) {
  const config = proxyConfig(env)
  if (!config.apiKey?.trim()) throw new Error('ZERA_APP_API_KEY is required')
  for (const service of ['administrative', 'inventory', 'analytics']) {
    if (!config[service]) throw new Error(`Missing upstream: ${service}`)
    validateProxyBase(config[service])
  }
  if (!env.ZERA_WEB_ORIGINS?.trim()) throw new Error('ZERA_WEB_ORIGINS is required')
  for (const origin of config.origins) {
    const url = new URL(origin)
    const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    if (url.origin !== origin || (url.protocol !== 'https:' && !localHttp)) throw new Error('Invalid web origin')
  }
  return config
}

export function createWebServer({ directory, config }) {
  const root = resolve(directory)
  const proxy = createProxy(config)
  return createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Cache-Control', 'no-store')
    try {
      const raw = (req.url ?? '/').split('?')[0]
      let pathname
      try { pathname = decodeURIComponent(raw) } catch { res.writeHead(400); res.end(); return }
      if (pathname.includes('\\') || pathname.includes('\0') || pathname.split('/').some(part => part.startsWith('.'))) { res.writeHead(404); res.end(); return }
      // API misses must never turn into index.html, even for invalid paths or methods.
      if (pathname === '/api' || pathname.startsWith('/api/')) { await proxy(req, res); return }
      if (!['GET', 'HEAD'].includes(req.method ?? '')) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return }
      if (pathname === '/healthz' || pathname === '/livez') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(req.method === 'HEAD' ? undefined : '{"status":"ok"}'); return }
      let target = resolve(root, `.${pathname}`)
      if (relative(root, target).startsWith(`..${sep}`) || relative(root, target) === '..') { res.writeHead(404); res.end(); return }
      let info
      try { info = await stat(target) } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error }
      if (!info?.isFile()) {
        // Stale chunks and missing assets should fail clearly instead of serving HTML as JavaScript.
        if (pathname.startsWith('/assets/') || extname(pathname) || !(req.headers.accept ?? '').includes('text/html')) { res.writeHead(404); res.end(); return }
        target = resolve(root, 'index.html')
        info = await stat(target)
      }
      const asset = pathname.startsWith('/assets/')
      res.writeHead(200, { 'Content-Type': MIME[extname(target)] ?? 'application/octet-stream', 'Content-Length': info.size, 'Cache-Control': asset ? 'public, max-age=31536000, immutable' : 'no-cache' })
      if (req.method === 'HEAD') { res.end(); return }
      await pipeline(createReadStream(target), res)
    } catch {
      if (res.headersSent) { res.destroy(); return }
      res.writeHead(500, { 'Content-Type': 'application/json' }); res.end('{"message":"Web service unavailable"}')
    }
  })
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const config = validateWebConfig(process.env)
  const directory = fileURLToPath(new URL('../dist/', import.meta.url))
  await readFile(resolve(directory, 'index.html'))
  const port = parseProxyPort(process.env.PORT || '8080')
  const server = createWebServer({ directory, config })
  server.listen(port, '0.0.0.0', () => process.stdout.write(`ZERA web listening on ${port}\n`))
  const shutdown = () => {
    server.close(() => { clearTimeout(deadline); process.exitCode = 0 })
    const deadline = setTimeout(() => server.closeAllConnections(), 20_000)
    deadline.unref()
  }
  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
}
