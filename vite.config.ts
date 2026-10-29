import { rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import { configuracaoProxy, origemPermitida, validarBaseProxy } from './server/config.mjs'

const root = process.cwd()

export default defineConfig(({ mode }) => {
  const envDir = ['production', 'test'].includes(mode) ? resolve(root, 'public') : root
  const env = loadEnv(mode, envDir, 'VITE_')
  const mswAtivo = mode !== 'production' && (process.env.VITE_USE_MSW ?? env.VITE_USE_MSW) === 'true'
  const privado = configuracaoProxy({ ...loadEnv(mode, root, ''), ...process.env })
  const proxy: Record<string, ProxyOptions> = {}
  const ausentes = new Set<string>()
  for (const servico of ['administrative', 'inventory', 'analytics'] as const) {
    const prefixo = `/api/${servico}`
    const base = privado[servico]
    if (!base || !privado.apiKey) { ausentes.add(prefixo); continue }
    proxy[prefixo] = {
      target: validarBaseProxy(base),
      changeOrigin: true,
      headers: { apiKey: privado.apiKey },
      rewrite: (path) => path.slice(prefixo.length),
      timeout: 0,
      proxyTimeout: 0,
      configure(proxyServer) {
        proxyServer.on('proxyRes', (response) => {
          if (response.headers['content-type']?.includes('text/event-stream')) {
            response.headers['cache-control'] = 'no-cache, no-transform'
            response.headers['x-accel-buffering'] = 'no'
          }
        })
      },
    }
  }

  return {
    envDir,
    cacheDir: process.env.ZERA_VITE_CACHE_DIR ?? 'node_modules/.vite',
    resolve: {
      alias: mode === 'production'
        ? [{ find: './mocks/browser', replacement: resolve(root, 'src/mocks/browser.disabled.ts') }]
        : [],
    },
    plugins: [
      react(),
      {
        name: 'report-missing-api-proxy',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            const path = req.url?.split('?')[0] ?? ''
            if (!/^\/api\/(administrative|inventory|analytics)(\/|$)/.test(path)) return next()
            const url = new URL(req.url ?? '/', 'http://localhost')
            const analytics = path.startsWith('/api/analytics/')
            const origin = req.headers.origin
            if (!origemPermitida(origin, req.headers.host, privado.origins)) {
              res.writeHead(403); res.end(); return
            }
            if (url.searchParams.has('access_token')
              || (analytics && (req.method !== 'GET' || !['/api/analytics/health', '/api/analytics/api/v1/dashboard/overview'].includes(path)))) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ detail: 'Rota invalida. Use GET e envie o JWT no header Authorization.' })); return
            }
            if (![...ausentes].some((prefixo) => path === prefixo || path.startsWith(`${prefixo}/`))) return next()
            res.writeHead(503, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ detail: 'Proxy nao configurado: confirme a base privada e ZERA_APP_API_KEY no servidor.' }))
          })
        },
      },
      {
        name: 'remove-disabled-msw-worker',
        apply: 'build',
        closeBundle() {
          if (!mswAtivo) rmSync(resolve(root, 'dist', 'mockServiceWorker.js'), { force: true })
        },
      },
    ],
    server: {
      port: 80,
      strictPort: true,
      proxy,
    },
  }
})
