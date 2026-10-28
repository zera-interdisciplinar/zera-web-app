import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { preparar } from './api-controlada'

for (const perfil of ['MANAGER', 'EMPLOYEE']) {
  for (const largura of [1280, 320]) test(`rotas e permissões: ${perfil}, ${largura}px`, async ({ page }) => {
    test.setTimeout(90_000)
    await preparar(page, perfil)
    await page.setViewportSize({ width: largura, height: 900 })
    const gestor = perfil === 'MANAGER'
    const rotas = [
      ['/', gestor ? 'Painel do Zera' : 'Meus itens'],
      ['/itens', 'Gestão de itens'],
      ['/itens/item-proprio', 'Notebook próprio'],
      ['/modelos', 'Modelos'],
      ['/recicladoras', 'Locais de reciclagem'],
      ['/descartes', 'Registros de descarte'],
      ['/funcionarios', gestor ? 'Funcionários' : 'Acesso restrito'],
      ['/configuracoes', 'Acesso restrito'],
      ['/relatorios', 'Acesso restrito'],
      ['/itens/item-proprio/triagem', 'Acesso restrito'],
      ['/rota-inexistente', 'Página não encontrada'],
    ]
    for (const [rota, titulo] of rotas) {
      await page.evaluate((url) => { history.pushState(null, '', url); dispatchEvent(new PopStateEvent('popstate')) }, rota)
      await expect(page.getByRole('heading', { level: 1, name: titulo, exact: true })).toBeVisible()
      const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(resultado.violations.map((violacao) => ({ id: violacao.id, alvos: violacao.nodes.map((no) => no.target) })), `${rota} ${perfil} ${largura}`).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), rota).toBe(true)
    }
  })
}
