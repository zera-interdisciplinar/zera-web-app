import { expect, test } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { preparar } from './api-controlada'

// Includes cold Vite compilation and intentionally paused route modules.
test.setTimeout(60_000)

test('o carregamento de uma rota mantém a navegação, o rodapé e um único main', async ({ page }) => {
  await preparar(page)
  let release: (() => void) | undefined
  const wait = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/src/pages/ItemsPage/index.tsx*', async (route) => { await wait; await route.continue() })
  try {
    await page.getByRole('navigation', { name: 'Seções do sistema' }).getByRole('link', { name: 'Itens', exact: true }).click()
    await expect(page.getByRole('status').filter({ hasText: 'Carregando a página.' })).toBeVisible()
    await expect(page.getByRole('banner')).toHaveCount(1)
    await expect(page.getByRole('navigation', { name: 'Seções do sistema' })).toBeVisible()
    await expect(page.getByRole('main')).toHaveCount(1)
    await expect(page.getByRole('contentinfo')).toHaveCount(1)
  } finally { release?.() }
  await expect(page.getByRole('heading', { name: 'Gestão de itens', exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('main')).toBeFocused()
})

test('uma falha inesperada preserva landmarks, alerta e foco no conteúdo de erro', async ({ page }) => {
  await preparar(page)
  await page.route('**/src/pages/ItemsPage/index.tsx*', (route) => route.fulfill({ contentType: 'application/javascript', body: 'export default function AuditFailure() { throw new Error("Controlled audit failure") }' }))
  await page.getByRole('navigation', { name: 'Seções do sistema' }).getByRole('link', { name: 'Itens', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Não foi possível abrir esta página' })).toBeVisible()
  await expect(page.getByRole('main')).toHaveCount(1)
  await expect(page.getByRole('banner')).toHaveCount(1)
  await expect(page.getByRole('contentinfo')).toHaveCount(1)
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('main')).toBeFocused()
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(result.violations.map((violation) => violation.id)).toEqual([])
})

test('filtros prendem o foco no diálogo e devolvem ao gatilho ao fechar com Esc', async ({ page }) => {
  await preparar(page)
  await page.getByRole('navigation', { name: 'Seções do sistema' }).getByRole('link', { name: 'Itens', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Gestão de itens', exact: true })).toBeVisible({ timeout: 15_000 })
  await page.bringToFront()
  const trigger = page.getByRole('button', { name: 'Filtros', exact: true })
  for (let attempt = 0; attempt < 2; attempt += 1) {
    await trigger.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: 'Filtrar itens' })
    await expect(dialog).toBeVisible()
    for (let step = 0; step < 18; step += 1) {
      await page.keyboard.press('Tab')
      expect(await dialog.evaluate(element => element.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
  }
})

for (const config of [{ width: 390, scale: 100 }, { width: 320, scale: 200 }]) test(`conta e logout por teclado: ${config.width}px, texto ${config.scale}%`, async ({ page }) => {
  await page.setViewportSize({ width: config.width, height: 844 })
  await preparar(page)
  if (config.scale === 200) {
    await page.getByRole('button', { name: 'Abrir opções de acessibilidade' }).click()
    await page.getByLabel('Tamanho do texto').selectOption('200')
    await page.getByRole('button', { name: 'Fechar', exact: true }).click()
  }
  await page.bringToFront()
  const profile = page.getByRole('button', { name: 'Perfil de Pessoa local', exact: true })
  await expect(profile).toHaveCount(1)
  await profile.focus()
  await page.keyboard.press('Enter')
  const logout = page.getByRole('menuitem', { name: 'Encerrar sessão' })
  await expect(logout).toBeVisible()
  await expect(logout).toBeFocused()
  const menu = page.getByRole('menu')
  const bounds = await menu.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(config.width + 1)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(845)
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
  expect(axe.violations.map((violation) => violation.id)).toEqual([])
  // axe opens a separate page for analysis; restore the keyboard target before exercising Esc.
  await page.bringToFront()
  await logout.focus()
  await page.keyboard.press('Escape')
  await expect(profile).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(logout).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
})


test('formulário longo rola internamente sem esconder o título e o botão de fechar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 480 })
  await preparar(page)
  await page.getByRole('navigation', { name: 'Seções do sistema' }).getByRole('link', { name: 'Modelos', exact: true }).click()
  await page.getByRole('button', { name: 'Novo modelo', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Novo modelo' })
  const body = dialog.locator('[class*="body"]')
  const header = dialog.locator('header')
  const before = await header.boundingBox()
  expect(await body.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true)
  await body.evaluate(element => { element.scrollTop = element.scrollHeight })
  const after = await header.boundingBox()
  expect(after!.y).toBeCloseTo(before!.y, 0)
  await expect(dialog.getByRole('button', { name: 'Fechar', exact: true })).toBeInViewport()
  await expect(dialog.getByRole('button', { name: 'Cadastrar modelo', exact: true })).toBeInViewport()
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')
  await dialog.getByRole('button', { name: 'Fechar', exact: true }).click()
  await expect(dialog).toBeHidden()
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')
})
