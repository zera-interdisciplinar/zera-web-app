import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { preparar } from './api-controlada'
import { dashboardSnapshotMock } from '../src/mocks/dashboardSseFixture'

for (const largura of [320, 1280]) {
  test(`dados disponíveis das abas do painel em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 })
    await preparar(page)
    const snapshot = structuredClone(dashboardSnapshotMock)
    snapshot.itens_por_mes = [{ mes: '2026-10', cadastrados: 17, encaminhados: 3 }]
    snapshot.alertas = { abertos: 4, por_gravidade: [{ gravidade: 'HIGH', quantidade: 4 }] }
    await page.route('**/api/analytics/api/v1/dashboard/overview?**', route => {
      expect(route.request().headers()['x-unit-id']).toBe('22222222-2222-4222-8222-222222222222')
      return route.fulfill({ contentType: 'text/event-stream', body: `event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n` })
    })
    await page.route('**/api/inventory/api/v1/dashboard/indicators', route => route.fulfill({ json: {
      totalWeightKg: 10, recyclingRatePercent: null, recyclingRateChangePoints: null,
      totalWeightChangePercent: null, monthlyWeightKg: [], weightByMaterial: [{ material: 'METAL', weightKg: 10, percent: 100 }],
    } }))
    for (const [aba, legenda] of [
      ['Itens e vida útil', 'Características estimadas por modelo'],
      ['Evolução e movimentações', 'Cadastros e encaminhamentos por mês'],
      ['Qualidade dos dados e alertas', 'Alertas por gravidade'],
      ['Materiais e sustentabilidade', 'Peso descartado por material'],
    ]) {
      await page.getByRole('tab', { name: aba, exact: true }).click()
      const tabela = page.getByRole('table', { name: legenda })
      await expect(tabela).toBeVisible()
      if (aba === 'Itens e vida útil') {
        await expect(tabela.getByRole('row')).toHaveCount(26)
        await expect(tabela.getByRole('cell', { name: '—', exact: true }).first()).toBeVisible()
        await expect(page.getByRole('img', { name: 'Itens por condição', exact: true })).toBeVisible()
      }
      if (aba === 'Evolução e movimentações') await expect(page.getByRole('img', { name: 'Evolução mensal dos cadastros', exact: true })).toBeVisible()
      if (aba === 'Qualidade dos dados e alertas') await expect(page.getByRole('img', { name: 'Alertas por gravidade', exact: true })).toBeVisible()
      if (aba === 'Materiais e sustentabilidade') await expect(tabela).toContainText('Metal')
      if (aba === 'Materiais e sustentabilidade') await expect(page.getByRole('img', { name: 'Peso descartado por material', exact: true })).toBeVisible()
      expect((await new AxeBuilder({ page }).analyze()).violations.map(v => v.id)).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    }
  })
}
