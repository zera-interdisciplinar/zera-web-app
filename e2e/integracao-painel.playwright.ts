import { test, expect } from '@playwright/test'
import { preparar } from './api-controlada'
import { dashboardSnapshotMock } from '../src/mocks/dashboardSseFixture'

test('o Funcionário pode consultar os indicadores agregados sem filtro de outras pessoas', async ({ page }) => {
  await preparar(page, 'EMPLOYEE')
  await page.route('**/api/analytics/api/v1/dashboard/overview?**', route => route.fulfill({ contentType: 'text/event-stream', body: `event: snapshot\ndata: ${JSON.stringify(dashboardSnapshotMock)}\n\n` }))
  await page.getByRole('button', { name: 'Ver indicadores da unidade' }).click()
  await page.getByRole('tab', { name: 'Visão geral', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Indicadores da unidade', exact: true })).toBeVisible()
  await expect(page.getByLabel('Responsável', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Unidade', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('img', { name: 'Itens por categoria', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Voltar aos meus itens' }).click()
  await expect(page.getByRole('heading', { name: 'Meus itens', exact: true })).toBeVisible()
})

test('recarregar um detalhe pede login novamente e retorna ao mesmo item', async ({ page }) => {
  await preparar(page)
  await page.evaluate(() => { history.pushState(null, '', '/itens/item-proprio'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page.getByRole('heading', { name: 'Notebook próprio', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('#email')).toBeVisible()
  await page.locator('#email').fill('pessoa@example.invalid')
  await page.locator('#senha').fill('somente-teste-local')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(/\/itens\/item-proprio$/)
  await expect(page.getByRole('heading', { name: 'Notebook próprio', exact: true })).toBeVisible()
})
