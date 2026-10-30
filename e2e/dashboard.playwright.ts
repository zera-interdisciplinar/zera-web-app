import { randomUUID } from 'node:crypto'
import { AxeBuilder } from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'
import { dashboardSnapshotMock } from '../src/mocks/dashboardSseFixture'

const base = 'http://127.0.0.1:5183'
test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, contentType: 'application/json', body: '{"detail":"API bloqueada pelo teste local"}' })
    return ['127.0.0.1', 'localhost'].includes(url.hostname) ? route.continue() : route.abort('blockedbyclient')
  })
})

async function entrarComApiControlada(page: Page) {
  const userId = randomUUID()
  const token = randomUUID()
  await page.route('**/api/administrative/api/v1/auth/login', (route) => route.fulfill({
    json: { accessToken: token, refreshToken: 'renovacao-sintetica', tokenType: 'Bearer', userId, expiresIn: 300 },
  }))
  await page.route(`**/api/administrative/api/v1/users/${userId}`, (route) => route.fulfill({
    json: { userId, unitId: 'unit-leste', name: 'Conta de teste local', email: 'teste@zera.com', role: 'MANAGER', status: 'ACTIVE' },
  }))
  await page.goto('http://127.0.0.1:5184/login')
  await page.locator('#email').fill('teste@zera.com')
  await page.locator('#senha').fill(randomUUID())
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  return token
}

test('contrato real com respostas controladas: loading, snapshot, filtros e logout', async ({ page }) => {
  let liberar: () => void = () => {}
  const inicio = new Promise<void>((resolve) => { liberar = resolve })
  const requests: Array<{ period: string | null; auth: string | undefined }> = []
  await page.route('**/api/analytics/api/v1/dashboard/overview?**', async (route) => {
    const request = route.request()
    const period = new URL(request.url()).searchParams.get('period')
    requests.push({ period, auth: request.headers().authorization })
    await inicio
    const snapshot = structuredClone(dashboardSnapshotMock)
    snapshot.batch_id = `teste-controlado-${period}`
    snapshot.organization.name = 'Organização de teste controlado'
    snapshot.alertas.abertos = period === '30d' ? 12 : 47
    snapshot.kpis.itens_cadastrados.change_percent = null
    snapshot.kpis.taxa_reciclagem.percent = null
    snapshot.kpis.taxa_reciclagem.change_points = null
    snapshot.circularidade.percent = null
    await route.fulfill({ contentType: 'text/event-stream', body: `: heartbeat\n\nevent: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n` })
  })
  const token = await entrarComApiControlada(page)
  await page.getByRole('tab', { name: 'Visão geral', exact: true }).click()
  await expect(page.locator('div[data-estado="carregando"]')).toBeVisible()
  liberar()
  await expect(page.locator('div[data-estado="sucesso"]')).toBeVisible()
  await expect(page.getByText(/^Atualização:/)).toBeVisible()
  const alertas = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Alertas registrados', exact: true }) })
  await expect(alertas).toContainText('47')
  await expect(page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Circularidade (%)', exact: true }) })).toContainText('—')
  await expect(page.getByText('DEMONSTRAÇÃO', { exact: true })).toHaveCount(0)
  await expect(page.locator('label[for="filtro-painel-period"]')).toHaveCount(1)
  await expect(page.getByLabel('Período', { exact: true })).toHaveAttribute('id', 'filtro-painel-period')
  await page.getByLabel('Período', { exact: true }).selectOption('30d')
  await expect(alertas).toContainText('12')
  expect(requests.some((request) => request.period === '30d')).toBe(true)
  expect(requests.every((request) => request.auth === `Bearer ${token}`)).toBe(true)
  await page.getByRole('button', { name: /^Perfil de / }).click()
  await page.getByRole('menuitem', { name: 'Encerrar sessão' }).click()
  await expect(page).toHaveURL(/\/login$/)
})

for (const status of [401, 403, 503]) {
  test(`analytics HTTP ${status} controlado não mostra fixtures nem simula sucesso`, async ({ page }) => {
    await page.route('**/api/analytics/api/v1/dashboard/overview?**', (route) => route.fulfill({
      status, json: { detail: 'Falha controlada no teste local' },
    }))
    await entrarComApiControlada(page)
    await page.getByRole('tab', { name: 'Visão geral', exact: true }).click()
    if (status === 401) {
      await expect(page).toHaveURL(/\/login$/)
    } else {
      await expect(page.locator('div[data-estado="erro"]')).toBeVisible()
      await expect(page.locator('div[data-estado="erro"] > [role="alert"]').filter({ hasText: status === 403 ? 'Seu perfil não tem acesso a este painel.' : 'Não conseguimos carregar agora.' })).toBeVisible()
    }
    await expect(page.getByText('DEMONSTRAÇÃO', { exact: true })).toHaveCount(0)
  })
}


for (const origem of [base, 'http://127.0.0.1:5184']) {
  test(`demonstração explícita e isolada de áreas privadas em ${origem}`, async ({ page }) => {
    const chamadas: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).pathname.startsWith('/api/')) chamadas.push(request.url())
    })
    await page.goto(`${origem}/login`)
    await expect(page.getByRole('link', { name: 'Ver demonstração sem fazer login' })).toHaveCount(0)
    await page.goto(`${origem}/demonstracao`)
    await expect(page.getByRole('heading', { name: 'Painel de demonstração' })).toBeVisible()
    await expect(page.getByText(/DADOS DE DEMONSTRAÇÃO/)).toBeVisible()
    for (const titulo of ['Itens e vida útil', 'Evolução e movimentações', 'Qualidade dos dados e alertas', 'Materiais e sustentabilidade']) {
      await expect(page.getByRole('heading', { name: titulo, exact: true })).toBeVisible()
    }
    expect(chamadas).toEqual([])
    expect((await new AxeBuilder({ page }).analyze()).violations.map(v => v.id)).toEqual([])
    await page.goto(`${origem}/itens`)
    await expect(page).toHaveURL(/\/login$/)
  })
}
