import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

async function abrir(page: Page, form: string) {
  await page.route('**/api/**', (route) => route.fulfill({ json: [] }))
  await page.goto(`http://127.0.0.1:5184/e2e/form-harness.html?form=${form}`)
}

async function verificar(page: Page, id: string, titulo: string) {
  const campo = page.locator(`#${id}`)
  await expect(campo).toHaveAttribute('aria-invalid', 'true')
  const descricao = await campo.getAttribute('aria-describedby')
  expect(descricao).toBeTruthy()
  await expect(page.locator(`#${descricao?.split(' ')[0]}`)).toBeVisible()
  await expect(page.locator('.resumo-erros')).toContainText(titulo)
  await expect(campo).toBeFocused()
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(resultado.violations.map((v) => v.id)).toEqual([])
}

test('componente Login: erros por campo, resumo e foco', async ({ page }) => {
  await abrir(page, 'login')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await verificar(page, 'email', 'Email')
})
