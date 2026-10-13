import { test, expect } from '@playwright/test'

const env = process.env
const marcador = 'PREENCHER_NO_VSCODE'
const usuariosDemo = [1, 2, 3].map((indice) => ({
  email: env[`VITE_DEMO_USER_${indice}_EMAIL`] ?? '',
  senha: env[`VITE_DEMO_USER_${indice}_PASSWORD`] ?? '',
}))

test('login apresenta somente os campos de acesso e o botão Entrar', async ({ page }) => {
  await page.goto('http://127.0.0.1:5183/login')
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible()
  await expect(page.locator('#email')).toBeVisible()
  await expect(page.locator('#senha')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible()
  await expect(page.getByText('Não tenho cadastro')).toHaveCount(0)
  await expect(page.getByText('Pré-visualização local')).toHaveCount(0)
  await expect(page.getByText('Abrir como')).toHaveCount(0)
  await expect(page.getByText('Voltar', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toHaveCount(0)
})

for (const [indice, usuario] of usuariosDemo.entries()) {
  test(`usuário demo ${indice + 1} entra no dashboard`, async ({ page }) => {
    test.skip(
      !usuario.email || !usuario.senha || usuario.senha === marcador,
      'PENDENTE_USUARIO: preencher a senha correspondente no .env',
    )

    await page.goto('http://127.0.0.1:5183/login')
    await page.getByLabel('Email').fill(usuario.email)
    await page.locator('#senha').fill(usuario.senha)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()

    await expect(page.getByRole('tab', { name: 'Visão geral' })).toBeVisible()
    await expect(page.getByText('DEMONSTRAÇÃO').first()).toBeVisible()
  })
}

test('credencial de demonstração inválida recebe mensagem uniforme', async ({ page }) => {
  await page.goto('http://127.0.0.1:5183/login')
  await page.getByLabel('Email').fill('nao-cadastrado@zera.com')
  await page.locator('#senha').fill(marcador)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha inválidos.' })).toBeVisible()
})

test('login real mostra erro específico em 401', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
  await page.goto('http://127.0.0.1:5184/login')
  await page.getByLabel('Email').fill('teste@zera.com')
  await page.locator('#senha').fill(marcador)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'E-mail ou senha inválidos.' })).toBeVisible()
})

test('login real informa falha de rede', async ({ page }) => {
  await page.route('**/api/v1/auth/login', (route) => route.abort('failed'))
  await page.goto('http://127.0.0.1:5184/login')
  await page.getByLabel('Email').fill('teste@zera.com')
  await page.locator('#senha').fill(marcador)
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('alert').filter({
    hasText: 'Servidor de autenticação indisponível. Tente novamente mais tarde.',
  })).toBeVisible()
})
