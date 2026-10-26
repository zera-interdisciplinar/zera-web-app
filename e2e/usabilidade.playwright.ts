import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

import { preparar } from './api-controlada'

async function axe(page: Page) {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([])
}

test('gestor: categorias, todos os modelos, validação, limites e Outro', async ({ page }) => {
  const { escritas } = await preparar(page)
  await page.getByRole('link', { name: 'Modelos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Todos os modelos (25 modelos)', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Modelo 25', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar categoria', exact: true }).click()
  await page.locator('#categoria-nome').fill('Eletrônicos usados')
  await page.locator('#categoria-descricao').fill('Para reaproveitar')
  await page.getByRole('button', { name: 'Salvar categoria', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Adicionar categoria', exact: true })).toBeHidden()
  await expect(page.getByRole('status').filter({ hasText: 'Categoria Eletrônicos usados cadastrada.' })).toBeVisible()
  await page.locator('#busca-modelos').fill('ELETRONICOS USADOS')
  await expect(page).toHaveURL(/q=ELETRONICOS/)
  const categoria = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Eletrônicos usados', exact: true }) })
  await expect(categoria).toContainText('Nenhum modelo nesta categoria ainda')
  await categoria.getByRole('button', { name: 'Adicionar modelo' }).click()
  await page.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(page.locator('#modelo-nome')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#modelo-nome')).toBeFocused()
  await page.locator('#modelo-nome').fill('Modelo novo')
  await page.locator('#modelo-fabricante').fill('Fabricante novo')
  await page.locator('#modelo-vida-util').pressSequentially('-2617')
  await expect(page.locator('#modelo-vida-util')).toHaveValue('600')
  await page.locator('#modelo-vida-util').fill('')
  await page.getByRole('checkbox', { name: 'Outro', exact: true }).check()
  await page.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(page.locator('#modelo-outro-material')).toHaveAttribute('aria-invalid', 'true')
  await page.locator('#modelo-outro-material').fill('Borracha')
  await axe(page)
  await page.screenshot({ path: 'test-results/modelo-outro.png', fullPage: true })
  await page.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(escritas.find((e) => e.caminho === '/api/v1/models')?.corpo).toMatchObject({ materials: ['OTHER'], notes: 'Outro material: Borracha' })
})
