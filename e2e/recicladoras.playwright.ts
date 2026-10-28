import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { preparar } from './api-controlada'

test('recicladora real: lista, erros por campo e cadastro no contrato administrativo', async ({ page }) => {
  await preparar(page)
  const empresas: Array<{ id: string; name: string; cnpj: string; email: string }> = []
  await page.route('**/api/administrative/api/v1/recyclings', async (route) => {
    if (route.request().method() === 'POST') {
      const dados = route.request().postDataJSON()
      expect(Object.keys(dados).sort()).toEqual(['cnpj', 'email', 'name'])
      empresas.push({ id: 'empresa-sintetica', ...dados })
      return route.fulfill({ json: empresas[0] })
    }
    return route.fulfill({ json: empresas })
  })
  await page.getByRole('link', { name: 'Locais de reciclagem' }).click()
  await expect(page.getByText('Nenhuma cooperativa cadastrada')).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar recicladora' }).click()
  await page.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(page.locator('#recicladora-nome')).toBeFocused()
  await expect(page.locator('#recicladora-email')).toHaveAttribute('aria-invalid', 'true')
  await page.locator('#recicladora-nome').fill('Recicladora sintética')
  await page.locator('#recicladora-cnpj').fill('12.345.678/0001-90')
  await page.locator('#recicladora-email').fill('contato@example.invalid')
  await page.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(page.getByRole('cell', { name: 'Recicladora sintética', exact: true })).toBeVisible()
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(resultado.violations.map((v) => v.id)).toEqual([])
})

test('funcionário consulta recicladoras sem ação de cadastro', async ({ page }) => {
  await preparar(page, 'EMPLOYEE')
  await page.getByRole('link', { name: 'Locais de reciclagem' }).click()
  await expect(page.getByRole('heading', { name: 'Recicladoras cadastradas' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Adicionar recicladora' })).toHaveCount(0)
})
