import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

export default defineConfig({
  plugins: [react(), {
    name: 'credencial-demo-local',
    apply: 'serve',
    resolveId(id) {
      if (id === 'virtual:credencial-demo') return '\0virtual:credencial-demo'
    },
    async load(id) {
      if (id !== '\0virtual:credencial-demo') return
      try {
        const fixture: unknown = JSON.parse(await readFile(new URL('./fixtures.local/admin.json', import.meta.url), 'utf8'))
        const senha = typeof fixture === 'object' && fixture !== null && 'senha' in fixture ? fixture.senha : null
        const digest = typeof senha === 'string' && senha.length > 0 ? createHash('sha256').update(senha).digest('hex') : ''
        return `export default ${JSON.stringify(digest)}`
      } catch {
        return 'export default ""'
      }
    },
  }],
})
