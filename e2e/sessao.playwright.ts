import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { base, preparar } from './api-controlada'

const logouts = (escritas: Array<{ caminho: string; corpo: Record<string, unknown> }>) => escritas.filter((escrita) => escrita.caminho === '/api/v1/auth/logout')

async function entrar(page: import('@playwright/test').Page) {
  await page.goto(`${base}/login`)
  await page.locator('#email').fill('pessoa@example.invalid')
  await page.locator('#senha').fill('somente-teste-local')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
}

test('T-01: funcionário não entra, o refresh token é revogado e nada fica na aba (BR-01)', async ({ page }) => {
  const { escritas } = await preparar(page, 'EMPLOYEE', 0, base, false)
  await entrar(page)
  await expect(page.getByRole('alert').filter({ hasText: 'Esta área é exclusiva para gestores. Use o app Zera.' })).toBeVisible()
  await expect(page).toHaveURL(`${base}/login`)
  expect(logouts(escritas).map((escrita) => escrita.corpo)).toEqual([{ refreshToken: 'renovacao-sintetica' }])
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
  await page.evaluate(() => { history.pushState(null, '', '/itens'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
  const resultado = await new AxeBuilder({ page }).analyze()
  expect(resultado.violations.filter((item) => item.impact === 'critical' || item.impact === 'serious').map((item) => item.id)).toEqual([])
})

test('T-02: refresh token de funcionário guardado na aba é recusado no carregamento', async ({ page }) => {
  const { escritas } = await preparar(page, 'EMPLOYEE', 0, base, false)
  await page.addInitScript(() => sessionStorage.setItem('zera.session.refresh', 'renovacao-antiga'))
  await page.goto(`${base}/itens`)
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
  await expect(page.getByText('Esta área é exclusiva para gestores.')).toBeVisible()
  expect(logouts(escritas).map((escrita) => escrita.corpo)).toEqual([{ refreshToken: 'renovacao-sintetica-1' }])
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
})

test('T-21: o gestor continua logado após recarregar a página (BR-21)', async ({ page }) => {
  const { escritas } = await preparar(page)
  expect(await page.evaluate(() => sessionStorage.getItem('zera.session.refresh'))).toBe('renovacao-sintetica')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Painel do Zera', exact: true })).toBeVisible()
  expect(escritas.filter((escrita) => escrita.caminho === '/api/v1/auth/refresh').map((escrita) => escrita.corpo)).toEqual([{ refreshToken: 'renovacao-sintetica' }])
  expect(await page.evaluate(() => sessionStorage.getItem('zera.session.refresh'))).toBe('renovacao-sintetica-1')
  // Tokens never go to localStorage (it is shared by every tab and survives the browser).
  expect(await page.evaluate(() => Object.entries(localStorage).filter(([key, value]) => /sess|token|refresh|jwt/i.test(key + value)).length)).toBe(0)
})

test('T-20: encerrar sessão revoga o refresh token no servidor e limpa a aba (BR-20)', async ({ page }) => {
  const { escritas } = await preparar(page)
  await page.getByRole('button', { name: /Perfil de/ }).click()
  await page.getByRole('menuitem', { name: 'Encerrar sessão' }).click()
  await expect(page).toHaveURL(`${base}/login`)
  expect(logouts(escritas).map((escrita) => escrita.corpo)).toEqual([{ refreshToken: 'renovacao-sintetica' }])
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Entrar', exact: true })).toBeVisible()
})

test('T-20: encerrar sessão funciona mesmo com a API fora do ar', async ({ page }) => {
  await preparar(page)
  await page.route('**/api/administrative/api/v1/auth/logout', (route) => route.abort('failed'))
  await page.getByRole('button', { name: /Perfil de/ }).click()
  await page.getByRole('menuitem', { name: 'Encerrar sessão' }).click()
  await expect(page).toHaveURL(`${base}/login`)
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
})

test('BR-19: recuperação de senha responde igual para conta existente, inexistente e erro de rede', async ({ page }) => {
  const { escritas } = await preparar(page, 'MANAGER', 0, base, false)
  await page.goto(`${base}/login`)
  const respostas: string[] = []
  for (const comportamento of ['202', '404', 'rede']) {
    await page.route('**/api/administrative/api/v1/auth/password-reset/request', (route) => comportamento === 'rede' ? route.abort('failed') : route.fulfill({ status: comportamento === '202' ? 202 : 404, body: '' }))
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
    await page.getByLabel('Email').last().fill('alguem@empresa.com.br')
    await page.getByRole('button', { name: 'Enviar link' }).click()
    respostas.push(await page.getByRole('status').filter({ hasText: 'Se o e-mail tiver conta ativa' }).innerText())
    await page.getByRole('button', { name: 'Fechar', exact: true }).last().click()
    await page.unroute('**/api/administrative/api/v1/auth/password-reset/request')
  }
  expect(new Set(respostas).size).toBe(1)
  expect(escritas).toBeDefined()
})
