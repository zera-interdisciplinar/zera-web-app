import { randomUUID } from 'node:crypto'
import { vi } from 'vitest'

// Testes nunca leem contas pessoais nem senhas de arquivos locais.
export function carregarEnvDemoNosTestes(): void {
  for (const numero of [1, 2, 3]) {
    const prefixo = `VITE_DEMO_USER_${numero}`
    vi.stubEnv(`${prefixo}_EMAIL`, `demo${numero}@zera.com`)
    vi.stubEnv(`${prefixo}_PASSWORD`, randomUUID())
    vi.stubEnv(`${prefixo}_ROLE`, numero === 1 ? 'EMPLOYEE' : numero === 2 ? 'MANAGER' : 'ADMIN')
    vi.stubEnv(`${prefixo}_NAME`, `Pessoa de demonstração ${numero}`)
  }
}
