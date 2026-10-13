import { test, expect } from '@playwright/test'
import { preparar } from './api-controlada'

test('busca de locais mostra erro e permite tentar novamente', async ({ page }) => {
  await preparar(page)
  let falhar = true
  await page.route('**/api/administrative/api/v1/recycling-places?**', route => falhar
    ? route.fulfill({ status: 200, json: { formato: 'inválido' } })
    : route.fulfill({ json: [] }))
  await page.getByRole('link', { name: 'Locais de reciclagem', exact: true }).click()
  const busca = page.getByRole('region', { name: 'Buscar locais de reciclagem' })
  await busca.locator('#locais-lat').fill('-23.5505')
  await busca.locator('#locais-lng').fill('-46.6333')
  await busca.getByRole('button', { name: 'Buscar locais', exact: true }).click()
  await expect(busca.getByRole('alert')).toBeVisible()
  const tentar = busca.getByRole('button', { name: 'Tentar novamente', exact: true })
  await expect(tentar).toBeVisible()
  falhar = false
  await tentar.click()
  await expect(busca.getByRole('alert')).toHaveCount(0)
  await expect(busca).toContainText('0 locais encontrados')
})
