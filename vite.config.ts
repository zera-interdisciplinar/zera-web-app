/// <reference types="vitest/config" />
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
    test: {
      // Local proxy fixtures and subprocess checks can exceed Vitest defaults on Windows.
      testTimeout: 20_000,
      hookTimeout: 20_000,
      coverage: {
        provider: 'v8',
        // The layers where the contract and the business rules live: services, utils and reducers. Components and
        // hooks need a browser and are exercised by the Playwright suite, so they stay out of the unit coverage.
        include: ['src/services/**/*.ts', 'src/utils/**/*.ts', 'src/reducers/**/*.ts'],
        exclude: ['**/*.d.ts', 'src/services/http.ts', 'src/services/session.ts'],
        reporter: ['text-summary', 'text'],
        thresholds: { lines: 80 },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  }
})
