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
      coverage: {
        provider: 'v8',
        // The layers where the contract and the business rules live (spec 12.1). Components and hooks need a
        // browser and are exercised by the Playwright suite, so they are left out of the unit coverage.
        include: ['src/shared/**/*.ts', 'src/features/*/{schemas,model,api}/**/*.ts'],
        exclude: ['**/*.d.ts', '**/index.ts', 'src/shared/**/use*.ts', 'src/shared/api/http.ts'],
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
