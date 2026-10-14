import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

const root = process.cwd()
const envFromFile = loadEnv('development', root, '')
if (process.env.ZERA_RUN_LIVE_QA === 'true') {
  const credenciaisQa: Record<string, string[]> = {
    QA_GESTOR_EMAIL: ['ZERA_QA_GESTOR_EMAIL', 'QA_GESTOR_EMAIL'],
    QA_GESTOR_PASSWORD: ['ZERA_QA_GESTOR_PASSWORD', 'QA_GESTOR_PASSWORD'],
    QA_OPERARIO_EMAIL: ['ZERA_QA_FUNCIONARIO_EMAIL', 'ZERA_QA_OPERADOR_EMAIL', 'QA_OPERADOR_EMAIL', 'QA_OPERARIO_EMAIL'],
    QA_OPERARIO_PASSWORD: ['ZERA_QA_FUNCIONARIO_PASSWORD', 'ZERA_QA_OPERADOR_PASSWORD', 'QA_OPERADOR_PASSWORD', 'QA_OPERARIO_PASSWORD'],
  }
  for (const [destino, alternativas] of Object.entries(credenciaisQa)) {
    if (process.env[destino]) continue
    const valor = alternativas.map((chave) => envFromFile[chave]).find((candidato) => candidato !== undefined && candidato.length > 0)
    if (valor !== undefined) process.env[destino] = destino.endsWith('_EMAIL') ? valor.trim() : valor
  }
}

const envTest = {
  ...process.env,
  ...loadEnv('development', root, 'VITE_'),
  VITE_API_BASE_URL: '/api',
  VITE_ADMIN_API_URL: '/api/administrative',
  VITE_INVENTORY_API_URL: '/api/inventory',
  VITE_USE_MSW: 'true',
  ZERA_VITE_CACHE_DIR: 'node_modules/.vite-e2e-demo',
}
const envReal = {
  ...process.env,
  ...loadEnv('development', root, 'VITE_'),
  VITE_API_BASE_URL: '/api/analytics',
  VITE_ADMIN_API_URL: '/api/administrative',
  VITE_INVENTORY_API_URL: '/api/inventory',
  VITE_USE_MSW: 'false',
  ZERA_VITE_CACHE_DIR: 'node_modules/.vite-e2e-real',
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.playwright.ts',
  fullyParallel: false,
  reporter: 'list',
  outputDir: process.env.ZERA_QA_ARTIFACT_DIR ?? 'test-results',
  use: {
    ...devices['Desktop Chrome'],
    browserName: 'chromium',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    headless: true,
    serviceWorkers: 'allow',
  },
  webServer: [
    {
      command: 'node ./node_modules/vite/bin/vite.js --mode test --host 127.0.0.1 --port 5183 --strictPort',
      url: 'http://127.0.0.1:5183',
      reuseExistingServer: false,
      timeout: 30_000,
      env: envTest,
    },
    {
      command: 'node ./node_modules/vite/bin/vite.js --mode test --host 127.0.0.1 --port 5184 --strictPort',
      url: 'http://127.0.0.1:5184',
      reuseExistingServer: false,
      timeout: 30_000,
      env: envReal,
    },
  ],
})
