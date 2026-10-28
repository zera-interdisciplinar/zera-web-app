import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

const root = process.cwd()
const envFromFile = loadEnv('development', root, '')
const qaKeys = ['QA_GESTOR_EMAIL', 'QA_GESTOR_PASSWORD', 'QA_OPERARIO_EMAIL', 'QA_OPERARIO_PASSWORD']
for (const key of qaKeys) {
  const value = envFromFile[key]
  if (value) process.env[key] ??= value
}

const envTest = {
  ...process.env,
  ...loadEnv('development', root, 'VITE_'),
  VITE_USE_MSW: 'true',
  VITE_DASHBOARD_DEMO_MODE: 'true',
}
const envReal = {
  ...process.env,
  ...loadEnv('development', root, 'VITE_'),
  VITE_USE_MSW: 'false',
  VITE_DASHBOARD_DEMO_MODE: 'false',
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.playwright.ts',
  fullyParallel: false,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    browserName: 'chromium',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    headless: true,
    serviceWorkers: 'allow',
  },
  webServer: [
    {
      command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5183 --strictPort',
      url: 'http://127.0.0.1:5183',
      reuseExistingServer: false,
      timeout: 30_000,
      env: envTest,
    },
    {
      command: 'node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5184 --strictPort',
      url: 'http://127.0.0.1:5184',
      reuseExistingServer: false,
      timeout: 30_000,
      env: envReal,
    },
  ],
})
