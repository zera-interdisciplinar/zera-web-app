import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { preparar } from './api-controlada'

for (const perfil of ['MANAGER']) {
  for (const largura of [1280, 320]) test(`rotas do gestor: ${perfil}, ${largura}px`, async ({ page }) => {
    test.setTimeout(90_000)
    await preparar(page, perfil)
    await page.setViewportSize({ width: largura, height: 900 })
    const rotas = [
      ['/', 'Painel do Zera'],
      ['/itens', 'Gestão de itens'],
      ['/itens/item-proprio', 'Notebook próprio'],
      ['/modelos', 'Modelos'],
      ['/rota-inexistente', 'Página não encontrada'],
    ]
    for (const [rota, titulo] of rotas) {
      await page.evaluate((url) => { history.pushState(null, '', url); dispatchEvent(new PopStateEvent('popstate')) }, rota)
      await expect(page.getByRole('heading', { level: 1, name: titulo, exact: true })).toBeVisible()
      await expect(page.getByRole('banner')).toHaveCount(1)
      await expect(page.getByRole('main')).toHaveCount(1)
      await expect(page.getByRole('navigation').first()).toBeVisible()
      await expect(page.getByRole('contentinfo')).toHaveCount(1)
      const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(resultado.violations.map((violacao) => ({ id: violacao.id, alvos: violacao.nodes.map((no) => no.target) })), `${rota} ${perfil} ${largura}`).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), rota).toBe(true)
    }
  })
}
