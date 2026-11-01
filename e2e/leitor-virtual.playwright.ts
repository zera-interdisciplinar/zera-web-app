import { test, expect, type Page } from '@playwright/test'
import type { virtual } from '@guidepup/virtual-screen-reader'
import { base, preparar } from './api-controlada'
import { snapshotFrame } from '../tests/fixtures/dashboardSnapshot'

declare global {
  interface Window { zeraLeitorVirtual: typeof virtual }
}

async function percorrer(page: Page): Promise<string[]> {
  await page.addScriptTag({ url: `${base}/e2e/leitor-virtual.ts`, type: 'module' })
  await page.waitForFunction(() => Boolean(window.zeraLeitorVirtual))
  return page.evaluate(async () => {
    const leitor = window.zeraLeitorVirtual
    await leitor.start({ container: document.body })
    try {
      for (let i = 0; i < 300 && await leitor.lastSpokenPhrase() !== 'end of document'; i += 1) await leitor.next()
      return await leitor.spokenPhraseLog()
    } finally { await leitor.stop() }
  })
}

test('leitor virtual percorre login, erro, painel, aba, itens e modal', async ({ page }) => {
  const anuncios: Record<string, string[]> = {}
  await page.goto(`${base}/login`)
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toMatchAriaSnapshot('- heading "Entrar" [level=1]')
  let falas = await percorrer(page)
  anuncios.login = falas
  expect(falas.join(' ')).toMatch(/email|e-mail/i)
  expect(falas.join(' ')).toMatch(/senha/i)
  expect(falas.join(' ')).toMatch(/textbox|edit text/i)
  expect(falas.join(' ')).toMatch(/button/i)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('#email')).toBeFocused()
  const alertaLogin = page.getByRole('alert').first()
  await expect(alertaLogin).toBeVisible()
  await expect(alertaLogin).toMatchAriaSnapshot('- alert')
  falas = await percorrer(page)
  anuncios.erro = falas
  expect(falas.join(' ')).toMatch(/email|e-mail/i)
  expect(falas.join(' ')).toMatch(/alert/i)
  expect(falas.join(' ')).toMatch(/obrigat|preench|inválid/i)

  await page.route('**/api/analytics/api/v1/dashboard/overview?**', (route) => route.fulfill({ contentType: 'text/event-stream', body: snapshotFrame() }))
  await preparar(page)
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toMatchAriaSnapshot('- heading "Visão geral" [level=1]')
  falas = await percorrer(page)
  anuncios.painel = falas
  expect(falas.join(' ')).toMatch(/Visão geral/i)
  expect(falas.join(' ')).toMatch(/main|navigation|heading/i)
  await page.getByRole('button', { name: 'Filtros', exact: true }).click()
  const visao = page.getByRole('dialog').getByRole('button', { name: 'últimos 30 dias', exact: true })
  await visao.click()
  await expect(visao).toHaveAttribute('aria-pressed', 'true')
  await expect(visao).toMatchAriaSnapshot('- button "últimos 30 dias" [pressed]')
  falas = await percorrer(page)
  anuncios.aba = falas
  expect(falas.join(' ')).toMatch(/últimos 30 dias/i)
  expect(falas.join(' ')).toMatch(/pressed/i)
  expect(falas.join(' ')).toMatch(/button/i)

  await page.getByRole('dialog').getByRole('button', { name: 'Aplicar filtros' }).click()
  await page.getByRole('link', { name: 'Itens', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Gestão de itens' })).toMatchAriaSnapshot('- heading "Gestão de itens" [level=1]')
  falas = await percorrer(page)
  anuncios.itens = falas
  expect(falas.join(' ')).toMatch(/Gestão de itens/i)
  expect(falas.join(' ')).toMatch(/navigation|main|heading/i)
  const abrir = page.getByRole('button', { name: 'Editar Notebook próprio', exact: true })
  await abrir.click()
  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()
  await expect(modal.locator(':focus')).toHaveCount(1)
  await expect(modal).toHaveAccessibleName(/Editar item/)
  falas = await percorrer(page)
  anuncios.modal = falas
  expect(falas.join(' ')).toMatch(/dialog|diálogo/i)
  expect(falas.join(' ')).toMatch(/Editar item/i)
  expect(falas.join(' ')).toMatch(/textbox|combobox|edit text/i)
  await page.keyboard.press('Escape')
  await expect(modal).toBeHidden()
  await expect(abrir).toBeFocused()
  await test.info().attach('anuncios-leitor-virtual', { body: JSON.stringify(anuncios, null, 2), contentType: 'application/json' })
})
