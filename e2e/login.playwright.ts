import { mkdirSync } from 'node:fs'
import { AxeBuilder } from '@axe-core/playwright'
import { test, expect } from '@playwright/test'

const baseDemo = 'http://127.0.0.1:5183'
const baseReal = 'http://127.0.0.1:5184'
const operario = { email: process.env.QA_OPERARIO_EMAIL ?? '', senha: process.env.QA_OPERARIO_PASSWORD ?? '' }

test('login preserva a marca e o formulário sem controles de demonstração ou voltar', async ({ page }) => {
  mkdirSync('test-results', { recursive: true })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${baseDemo}/login`)
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#senha')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Sobre o Zera' })).toBeVisible()
  await expect(page.getByText('Preencha seus dados para entrar na sua conta')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toBeVisible()
  await expect(page.getByText('Não tenho cadastro')).toHaveCount(0)
  await expect(page.getByText('Pré-visualização local')).toHaveCount(0)
  await expect(page.getByText('Abrir como')).toHaveCount(0)
  await expect(page.getByText('Voltar', { exact: true })).toHaveCount(0)
  const axeLogin = await new AxeBuilder({ page }).analyze()
  expect(axeLogin.violations.filter((item) => item.impact === 'critical' || item.impact === 'serious').map((item) => item.id)).toEqual([])
  for (let passo = 0; passo < 5; passo += 1) {
    await page.keyboard.press('Tab')
    const focoVisivel = await page.locator(':focus').evaluate((element) => {
      const computed = getComputedStyle(element)
      const container = element.parentElement ? getComputedStyle(element.parentElement) : null
      return Number.parseFloat(computed.outlineWidth) > 0
        || Boolean(container && Number.parseFloat(container.outlineWidth) > 0)
        || computed.boxShadow !== 'none'
    })
    expect(focoVisivel).toBe(true)
  }
  await page.screenshot({ path: 'test-results/login-restaurada.png', fullPage: true })
})

test('login real do operário QA leva à área privada', async ({ page }) => {
  test.skip(!operario.email || !operario.senha, 'PENDENTE_USUARIO: configurar QA_OPERARIO_EMAIL e QA_OPERARIO_PASSWORD no .env')
  await page.goto(`${baseReal}/login`)
  await page.getByLabel('Email').fill(operario.email)
  await page.locator('#senha').fill(operario.senha)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Dashs do Zera' })).toBeVisible()
})

test('credencial inválida mostra erro específico em 401', async ({ page }) => {
  const senhaQa = process.env.QA_GESTOR_PASSWORD ?? ''
  test.skip(!senhaQa, 'PENDENTE_USUARIO: configurar QA_GESTOR_PASSWORD no .env')
  await page.route('**/api/v1/auth/login', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
  await page.goto(`${baseReal}/login`)
  await page.getByLabel('Email').fill('qa-invalido@zera.com')
  await page.locator('#senha').fill(senhaQa)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha inválidos.' })).toBeVisible()
})

test('falha de rede mostra indisponibilidade do serviço', async ({ page }) => {
  const senhaQa = process.env.QA_GESTOR_PASSWORD ?? ''
  test.skip(!senhaQa, 'PENDENTE_USUARIO: configurar QA_GESTOR_PASSWORD no .env')
  await page.route('**/api/v1/auth/login', (route) => route.abort('failed'))
  await page.goto(`${baseReal}/login`)
  await page.getByLabel('Email').fill('qa-invalido@zera.com')
  await page.locator('#senha').fill(senhaQa)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert').filter({
    hasText: 'Servidor de autenticação indisponível. Tente novamente mais tarde.',
  })).toBeVisible()
})

test('rota privada sem sessão retorna para o login', async ({ page }) => {
  await page.goto(`${baseReal}/itens`)
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  const resultado = await new AxeBuilder({ page }).analyze()
  expect(resultado.violations.filter((item) => item.impact === 'critical' || item.impact === 'serious').map((item) => item.id)).toEqual([])
  await page.goto(`${baseReal}/rota-nao-existente`)
  await expect(page.getByRole('heading', { name: 'Página não encontrada' })).toBeVisible()
  const resultado404 = await new AxeBuilder({ page }).analyze()
  expect(resultado404.violations.filter((item) => item.impact === 'critical' || item.impact === 'serious').map((item) => item.id)).toEqual([])
})

test('recuperação valida formato e domínio sem afirmar envio', async ({ page }) => {
  await page.goto(`${baseDemo}/esqueci-senha`)
  await page.getByLabel('Email').fill('alguem@example.com')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('alert')).toContainText('@zera.com')

  await page.getByLabel('Email').fill('usuario@zera.com')
  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByRole('status')).toContainText('Se houver uma conta com este e-mail')
  await expect(page.getByText(/endpoint de recuperação ainda não foi confirmado/i)).toBeVisible()
  const axeRecovery = await new AxeBuilder({ page }).analyze()
  expect(axeRecovery.violations.filter((item) => item.impact === 'critical' || item.impact === 'serious').map((item) => item.id)).toEqual([])
})
