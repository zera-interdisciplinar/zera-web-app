import { randomUUID } from 'node:crypto'
import { test, expect } from '@playwright/test'

const baseMsw = 'http://127.0.0.1:5183'
const baseReal = 'http://127.0.0.1:5184'

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
      'Distribuição da idade dos itens', 'Distribuição do peso estimado', 'Distribuição da vida útil estimada',
      'Distribuição da garantia', 'Distribuição da vida útil consumida', 'Distribuição dos meses restantes',
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
    graficos: ['Alertas por tipo', 'Preenchimento dos dados dos itens', 'Taxa de alertas resolvidos', 'Intensidade de uso'],
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

async function entrarNoDashboardDemo(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.setItem('zera.sessao', JSON.stringify({
      _versao: 2,
      dados: {
        usuario: { id: 'playwright', nome: 'QA local', email: 'qa@zera.com', perfil: 'gestor', unidade: 'Unidade Centro' },
        expiraEm: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      },
    }))
  })
  await page.goto(`${baseMsw}/`)
  await expect(page.getByRole('heading', { name: 'Dashs do Zera' })).toBeVisible()
  await expect(page.getByText('DEMONSTRAÇÃO').first()).toBeVisible()
}

test('cinco abas MSW: filtros, gráficos, selos e screenshots da referência', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 })
  const urlsStream: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/dashboard/overview')) urlsStream.push(request.url())
  })
  await entrarNoDashboardDemo(page)

  for (const aba of abas) {
    await page.getByRole('tab', { name: aba.nome }).click()
    for (const filtro of aba.filtros) await expect(page.getByLabel(filtro, { exact: true })).toBeVisible()
    const painel = page.locator(`#painel-${aba.id}`)
    for (const titulo of aba.graficos) {
      await expect(painel.getByRole('heading', { name: new RegExp(titulo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })).toBeVisible()
    }
    await expect(painel.getByText('DEMONSTRAÇÃO').first()).toBeVisible()
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
    if (aba.id === 'materials') {
      await expect(painel.getByText('Sim', { exact: true }).first()).toBeVisible()
      await expect(painel.getByText('Não', { exact: true }).first()).toBeVisible()
    }
    await page.waitForTimeout(1600)
    await page.screenshot({ path: `test-results/dashboard-${aba.id}.png`, fullPage: true })
  }

  await page.getByRole('tab', { name: 'Evolução e movimentações' }).click()
  const requisicoesAntes = urlsStream.length
  await page.getByLabel('Período').selectOption('30d')
  await expect.poll(() => urlsStream.length).toBeGreaterThan(requisicoesAntes)
  await expect(page.locator('#painel-evolution').getByRole('heading', { name: /Cadastros por mês/ })).toHaveCount(1)
})

test('modo real não renderiza fixture e envia o token somente no cabeçalho', async ({ page }) => {
  const accessToken = randomUUID()
  let authorizationEnviado = false
  let tokenNaUrl = false
  let overviewSolicitado = false
  let ocorrenciasApi = 0

  await page.route('**/api/v1/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ accessToken, userId: 'qa-real', expiresIn: 3600 }),
  }))
  await page.route('**/api/v1/users/*', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ userId: 'qa-real', name: 'QA real', email: 'qa@example.invalid', role: 'MANAGER', unitId: 'unit-test' }),
  }))
  await page.route('**/v1/dashboard/overview**', async (route) => {
    const request = route.request()
    overviewSolicitado = true
    authorizationEnviado = request.headers().authorization?.startsWith('Bearer ') ?? false
    const url = new URL(request.url())
    tokenNaUrl = url.searchParams.has('access_token')
    ocorrenciasApi = url.pathname.match(/\/api/g)?.length ?? 0
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: 'event: unavailable\ndata: {"detail":"snapshot not ready"}\n\n',
    })
  })

  await page.goto(`${baseReal}/login`)
  await page.getByLabel('Email').fill('qa@example.invalid')
  await page.locator('#senha').fill(randomUUID())
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Dashs do Zera' })).toBeVisible()
  await expect.poll(() => overviewSolicitado).toBe(true)
  await expect(page.getByText('snapshot not ready')).toBeVisible()
  await expect.poll(() => authorizationEnviado).toBe(true)
  expect(tokenNaUrl).toBe(false)
  expect(ocorrenciasApi).toBe(1)

  for (const aba of abas) {
    await page.getByRole('tab', { name: aba.nome }).click()
    const painel = page.locator(`#painel-${aba.id}`)
    await expect(painel.getByText('DEMONSTRAÇÃO', { exact: true })).toHaveCount(0)
    await expect(painel.getByText('Fixture MSW')).toHaveCount(0)
    if (aba.id !== 'overview') await expect(painel.getByText(/sem fonte confirmada/i).first()).toBeVisible()
  }
})
