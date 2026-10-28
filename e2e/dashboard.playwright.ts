import { mkdirSync } from 'node:fs'
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
    json: { accessToken: token, userId, expiresIn: 300 },
  }))
  await page.route(`**/api/administrative/api/v1/users/${userId}`, (route) => route.fulfill({
    json: { userId, unitId: 'unit-leste', name: 'Conta de teste local', email: 'teste@zera.com', role: 'MANAGER' },
  }))
  await page.goto('http://127.0.0.1:5184/login')
  await page.getByLabel('Email', { exact: true }).fill('teste@zera.com')
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
    snapshot.kpis.itens_cadastrados.value = period === '30d' ? 12 : 47
    snapshot.kpis.itens_cadastrados.change_percent = null
    snapshot.kpis.taxa_reciclagem.percent = null
    snapshot.kpis.taxa_reciclagem.change_points = null
    snapshot.circularidade.percent = null
    await route.fulfill({ contentType: 'text/event-stream', body: `: heartbeat\n\nevent: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n` })
  })
  const token = await entrarComApiControlada(page)
  await expect(page.locator('[data-estado="carregando"]')).toBeVisible()
  liberar()
  await expect(page.locator('[data-estado="sucesso"]')).toBeVisible()
  await expect(page.getByText(/Dados de analytics · Organização de teste controlado/)).toBeVisible()
  const itens = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Itens cadastrados', exact: true }) })
  await expect(itens).toContainText('47')
  await expect(page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Circularidade (%)', exact: true }) })).toContainText('—')
  await expect(page.getByText('DEMONSTRAÇÃO', { exact: true })).toHaveCount(0)
  await page.getByLabel('Período', { exact: true }).selectOption('30d')
  await expect(itens).toContainText('12')
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
    if (status === 401) {
      await expect(page).toHaveURL(/\/login$/)
    } else {
      await expect(page.locator('[data-estado="erro"]')).toBeVisible()
      await expect(page.getByRole('alert').filter({ hasText: status === 403 ? 'Seu perfil não tem acesso ao painel de analytics.' : 'HTTP 503' })).toBeVisible()
    }
    await expect(page.getByText('DEMONSTRAÇÃO', { exact: true })).toHaveCount(0)
  })
}

const abas = [
  {
    id: 'overview',
    nome: 'Visão geral',
    filtros: ['Situação', 'Condição', 'Categoria'],
    graficos: ['Itens por situação', 'Itens por categoria', 'Itens por condição', 'Itens por fabricante', 'Itens por modelo'],
  },
  {
    id: 'life',
    nome: 'Itens e vida útil',
    filtros: ['Categoria', 'Situação', 'Condição', 'Mês de cadastro'],
    graficos: [
      'Distribuição da idade dos itens (meses)', 'Distribuição do peso estimado (kg)', 'Distribuição da vida útil estimada (meses)',
      'Distribuição da garantia (meses)', 'Distribuição da vida útil consumida (%)', 'Distribuição dos meses restantes',
      'Idade por condição — boxplot', 'Peso por condição — boxplot', 'Vida útil consumida por situação',
      'Idade × vida útil consumida', 'Peso × vida útil estimada',
    ],
  },
  {
    id: 'evolution',
    nome: 'Evolução e movimentações',
    filtros: ['Período', 'Unidade'],
    graficos: [
      'Cadastros por dia', 'Cadastros por mês', 'Cadastros por situação e mês',
      'Idade média dos itens por mês', 'Eventos por dia', 'Eventos por tipo',
      'Evolução mensal dos eventos por tipo', 'Evolução mensal de novos itens e movimentações',
      'Participação das movimentações por tipo',
    ],
  },
  {
    id: 'quality',
    nome: 'Qualidade dos dados e alertas',
    filtros: ['Situação', 'Categoria', 'Unidade'],
    graficos: ['Alertas por tipo', 'Preenchimento dos dados dos itens', 'Taxa de alertas resolvidos', 'Intensidade de uso — validar escala com a equipe'],
  },
  {
    id: 'materials',
    nome: 'Materiais e sustentabilidade',
    filtros: ['Material reciclável', 'Material perigoso', 'Condição do item'],
    graficos: [
      'Quantidade de itens por material', 'Itens por classificação de reciclabilidade',
      'Itens associados a material perigoso', 'Associações de itens a materiais perigosos',
      'Associações de itens a materiais recicláveis', 'Itens por condição e potencial reciclável',
      'Itens por condição e material perigoso', 'Associações por potencial de reciclagem',
    ],
  },
] as const

test('demonstração pública percorre as cinco abas sem sessão nem chamadas QA', async ({ page }) => {
  mkdirSync('test-results', { recursive: true })
  await page.setViewportSize({ width: 1600, height: 1000 })
  const requestsOverview: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.endsWith('/v1/dashboard/overview')) requestsOverview.push(request.url())
  })

  await page.goto(`${base}/login`)
  await page.getByRole('link', { name: 'Ver demonstração sem fazer login' }).click()
  await expect(page.getByRole('heading', { name: 'Dashs do Zera' })).toBeVisible()
  await expect(page.getByText('DADOS DE DEMONSTRAÇÃO: API de analytics indisponível neste ambiente.')).toBeVisible()

  for (const aba of abas) {
    await page.getByRole('tab', { name: aba.nome }).click()
    for (const filtro of aba.filtros) await expect(page.getByLabel(filtro, { exact: true })).toBeVisible()
    const painel = page.locator(`#painel-${aba.id}`)
    for (const titulo of aba.graficos) {
      await expect(painel.getByRole('heading', { name: `${titulo} DEMONSTRAÇÃO`, exact: true })).toBeVisible()
    }
    await expect(painel.getByText('DEMONSTRAÇÃO', { exact: true })).toHaveCount(await painel.locator('h2').count())

    if (aba.id === 'overview' || aba.id === 'quality') {
      await expect(painel.locator('.recharts-bar-rectangle').first()).toBeVisible()
    }
    if (aba.id === 'life') await expect(painel.locator('.recharts-scatter-symbol').first()).toBeVisible()
    if (aba.id === 'evolution') await expect(painel.locator('.recharts-surface').first()).toBeVisible()
    if (aba.id === 'materials') {
      await expect(painel.locator('.recharts-bar-rectangle').first()).toBeVisible()
      await expect(painel.locator('.recharts-pie-sector').first()).toBeVisible()
    }
    if (aba.id === 'quality') {
      await expect(painel.getByText(/Ainda não calculável: falta confirmar/)).toBeVisible()
      await expect(painel.getByRole('heading', { name: /validar escala com a equipe/ })).toBeVisible()
    }

    const resultadoAxe = await new AxeBuilder({ page }).analyze()
    const violacoesBloqueantes = resultadoAxe.violations.filter((item) => item.impact === 'critical' || item.impact === 'serious')
    expect(violacoesBloqueantes.map((item) => item.id)).toEqual([])
    await page.screenshot({ path: `test-results/dashboard-${aba.id}.png`, fullPage: true })
  }

  expect(requestsOverview).toHaveLength(0)
  await page.getByRole('link', { name: 'Voltar ao login' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto(`${base}/itens`)
  await expect(page).toHaveURL(/\/login$/)
})

test('MSW=false oferece demonstração identificada sem liberar áreas privadas', async ({ page }) => {
  await page.goto('http://127.0.0.1:5184/login')
  await page.getByRole('link', { name: 'Ver demonstração sem fazer login' }).click()
  await expect(page).toHaveURL(/\/demonstracao$/)
  await expect(page.getByRole('alert')).toContainText('DADOS DE DEMONSTRAÇÃO')
  await expect(page.getByText('DEMONSTRAÇÃO', { exact: true }).first()).toBeVisible()
  await page.getByRole('tab', { name: 'Visão geral' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Itens e vida útil' })).toBeFocused()
  await expect(page.getByRole('tab', { name: 'Itens e vida útil' })).toHaveAttribute('aria-selected', 'true')
  await page.goto('http://127.0.0.1:5184/')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Dashs do Zera' })).toHaveCount(0)
})
