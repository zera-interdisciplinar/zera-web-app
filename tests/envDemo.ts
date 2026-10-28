import { loadEnv } from 'vite'
import { vi } from 'vitest'

const env = loadEnv('test', process.cwd(), 'VITE_')

export function carregarEnvDemoNosTestes(): void {
  for (const numero of [1, 2, 3]) {
    for (const campo of ['EMAIL', 'PASSWORD', 'ROLE', 'NAME']) {
      const chave = `VITE_DEMO_USER_${numero}_${campo}`
      const valor = env[chave]
      if (valor !== undefined) vi.stubEnv(chave, valor)
    }
  }
}
