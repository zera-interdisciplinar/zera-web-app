import { test, expect, type Page } from '@playwright/test'
import type { virtual } from '@guidepup/virtual-screen-reader'
import { base, preparar } from './api-controlada'

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
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.locator('#email')).toBeFocused()
  await expect(page.getByRole('alert').first()).toBeVisible()
  falas = await percorrer(page)
  anuncios.erro = falas
  expect(falas.join(' ')).toMatch(/email|e-mail/i)
  expect(falas.join(' ')).toMatch(/alert/i)

  await preparar(page)
  await expect(page.getByRole('heading', { name: 'Painel do Zera' })).toMatchAriaSnapshot('- heading "Painel do Zera" [level=1]')
  falas = await percorrer(page)
  anuncios.painel = falas
  expect(falas.join(' ')).toMatch(/Painel do Zera/i)
  const aba = page.getByRole('tab', { name: 'Visão geral', exact: true })
  await aba.click()
  await expect(aba).toHaveAttribute('aria-selected', 'true')
  await expect(aba).toMatchAriaSnapshot('- tab "Visão geral" [selected]')
  falas = await percorrer(page)
  anuncios.aba = falas
  expect(falas.join(' ')).toMatch(/Visão geral/i)
  expect(falas.join(' ')).toMatch(/selected/i)

  await page.getByRole('link', { name: 'Itens', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Gestão de itens' })).toMatchAriaSnapshot('- heading "Gestão de itens" [level=1]')
  falas = await percorrer(page)
  anuncios.itens = falas
  expect(falas.join(' ')).toMatch(/Gestão de itens/i)
  const abrir = page.getByRole('button', { name: 'Adicionar item', exact: true })
  await abrir.click()
  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible()
  await expect(modal.locator(':focus')).toHaveCount(1)
  await expect(modal).toMatchAriaSnapshot('- dialog "Cadastrar item"')
  falas = await percorrer(page)
  anuncios.modal = falas
  expect(falas.join(' ')).toMatch(/dialog|diálogo/i)
  await page.keyboard.press('Escape')
  await expect(modal).toBeHidden()
  await expect(abrir).toBeFocused()
  await test.info().attach('anuncios-leitor-virtual', { body: JSON.stringify(anuncios, null, 2), contentType: 'application/json' })
})
