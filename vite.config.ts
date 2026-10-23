import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createProxy } from './server/proxy.mjs'
import { proxyConfig } from './server/config.mjs'

const root = process.cwd()
const API_PATH = /^\/api\/(administrative|inventory|analytics)(\/|$)/

export default defineConfig(({ mode }) => {
  const proxy = createProxy(proxyConfig({ ...loadEnv(mode, root, ''), ...process.env }))

  return {
    cacheDir: process.env.ZERA_VITE_CACHE_DIR ?? 'node_modules/.vite',
    // Pre-bundled up front so the first e2e page load does not trigger a reload mid-test.
    optimizeDeps: mode === 'test' ? { include: ['@guidepup/virtual-screen-reader'] } : undefined,
    plugins: [
      react(),
      {
        // The same allowlisted proxy served by `npm run api:proxy`, so dev and standalone cannot diverge.
        name: 'zera-api-proxy',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (!API_PATH.test(req.url?.split('?')[0] ?? '')) return next()
            void proxy(req, res)
          })
        },
      },
    ],
    server: {
      port: 5173,
      strictPort: true,
    },
  }
})
