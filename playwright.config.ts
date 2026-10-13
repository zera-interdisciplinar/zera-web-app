import { defineConfig, devices } from '@playwright/test'
import { loadEnv } from 'vite'

const root = process.cwd()
const envFromFile = loadEnv('development', root, 'VITE_')
for (const [key, value] of Object.entries(envFromFile)) {
  process.env[key] ??= value
}

const envTest = { ...process.env, VITE_USE_MSW: 'true' }
const envReal = { ...process.env, VITE_USE_MSW: 'false' }

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.playwright.ts',
  fullyParallel: false,
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    browserName: 'chromium',
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
