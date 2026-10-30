import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

it('não expõe dashboard de demonstração na aplicação', () => {
  const rotas = readFileSync('src/routes/AppRoutes.tsx', 'utf8')
  const pagina = readFileSync('src/pages/DashboardPage/index.tsx', 'utf8')
  expect(rotas).not.toContain('/demonstracao')
  expect(rotas).not.toContain('DashboardDemo')
  expect(pagina).not.toContain('DashboardDemo')
  expect(pagina).not.toContain('dashboardSnapshotMock')
})
