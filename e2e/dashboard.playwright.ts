import { AxeBuilder } from '@axe-core/playwright'
import { test, expect, type Page } from '@playwright/test'
import { dashboardSnapshotMock, snapshotFrame } from '../tests/fixtures/dashboardSnapshot'
import { base, fazerLogin, preparar } from './api-controlada'

const OVERVIEW = '**/api/analytics/api/v1/dashboard/overview?**'

interface Seen { url: URL; auth: string | undefined; unit: string | undefined }

/** Mocks the APIs first, then the overview (later routes win), and only then logs in. */
async function abrir(page: Page, frame?: (url: URL) => string, role = 'MANAGER'): Promise<{ seen: Seen[]; escritas: Awaited<ReturnType<typeof preparar>>['escritas'] }> {
  const { escritas } = await preparar(page, role, 0, base, false)
  const seen = await serveOverview(page, frame)
  await fazerLogin(page)
  return { seen, escritas }
}

/** Os filtros ficam recolhidos, como no Figma: abre o bloco antes de usá-los. */
async function abrirFiltros(page: Page) {
  const periodo = page.getByLabel('Período', { exact: true })
  if (!(await periodo.isVisible())) await page.locator('summary', { hasText: 'Filtros' }).click()
  await expect(periodo).toBeVisible()
}

/** Answers every overview request with the given frame and records what the browser sent. */
async function serveOverview(page: Page, frame: (url: URL) => string = () => snapshotFrame()): Promise<Seen[]> {
  const seen: Seen[] = []
  await page.route(OVERVIEW, (route) => {
    const request = route.request()
    const url = new URL(request.url())
    seen.push({ url, auth: request.headers().authorization, unit: request.headers()['x-unit-id'] })
    return route.fulfill({ contentType: 'text/event-stream', body: `: heartbeat\n\n${frame(url)}` })
  })
  return seen
}

test('T-05: abrir o dashboard usa só o BFF de analytics e nenhuma consulta ao inventário (BR-05)', async ({ page }) => {
  const inventario: string[] = []
  page.on('request', (request) => { if (new URL(request.url()).pathname.startsWith('/api/inventory/')) inventario.push(request.url()) })
  const { seen } = await abrir(page)
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible()
  await expect(page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Itens cadastrados' }) })).toContainText('1.230')
  // O stream simulado termina logo; o cliente reabre depois de 1 s, sempre com os mesmos filtros e sem polling por outra rota.
  expect(new Set(seen.map((item) => item.url.search))).toEqual(new Set(['?period=6m&view=todos']))
  expect(seen[0].url.searchParams.get('period')).toBe('6m')
  expect(seen[0].url.searchParams.get('view')).toBe('todos')
  expect(seen[0].auth).toMatch(/^Bearer sessao-sintetica/)
  expect(seen[0].unit).toBe('22222222-2222-4222-8222-222222222222')
  expect(seen[0].url.search).not.toMatch(/access_token|jwt|sessao-sintetica/)
  expect(inventario).toEqual([])
})

test('os quatro KPIs, os gráficos e a distribuição do Figma vêm do snapshot', async ({ page }) => {
  await abrir(page)
  const cards = page.getByRole('region', { name: 'Indicadores gerais' })
  await expect(cards).toContainText('Itens cadastrados')
  await expect(cards).toContainText('+12,4% no período')
  await expect(cards).toContainText('68%')
  await expect(cards).toContainText('+4,5 p.p. no período')
  await expect(cards).toContainText('42')
  await expect(cards.getByRole('link', { name: '8 prioritários' })).toHaveAttribute('href', '/itens?status=PENDING_APPROVAL')
  await expect(cards).toContainText('3,1 t')
  await expect(page.getByRole('heading', { name: 'Itens por mês' })).toBeVisible()
  await expect(page.getByRole('img', { name: /Itens por mês: 47 cadastrados/ })).toBeVisible()
  await page.getByText('Ver dados do gráfico').click()
  await expect(page.getByRole('table')).toContainText('out/26')
  await expect(page.getByRole('img', { name: 'Circularidade: 62,4%' })).toBeVisible()
  const distribuicao = page.getByRole('region', { name: 'Distribuição do inventário' })
  await expect(distribuicao).toContainText('Tecnologia')
  await expect(distribuicao).toContainText('Em aprovação')
  await expect(distribuicao).toContainText('Alta')
  await expect(page.getByText(/meta/i)).toHaveCount(0)
})

test('BR-08: valores nulos viram traço com explicação, nunca zero', async ({ page }) => {
  const nulos = structuredClone(dashboardSnapshotMock)
  nulos.kpis.itens_cadastrados.change_percent = null
  nulos.kpis.taxa_reciclagem = { percent: null, change_points: null }
  nulos.circularidade.percent = null
  await abrir(page, () => snapshotFrame(nulos))
  const taxa = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Taxa de reciclagem' }) })
  await expect(taxa).toContainText('—')
  await expect(taxa.getByLabel('Sem base de comparação')).toBeVisible()
  await expect(taxa).not.toContainText('0%')
  await expect(page.getByText('A circularidade ainda não foi calculada')).toBeVisible()
})

test('T-06: cada mudança de filtro abre uma nova conexão com a query certa e atualiza a URL (BR-06)', async ({ page }) => {
  const { seen } = await abrir(page, (url) => snapshotFrame({ ...dashboardSnapshotMock, batch_id: `b-${url.search}`, alertas: { abertos: url.searchParams.get('period') === '30d' ? 12 : 6, por_gravidade: [] } }))
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible()
  await abrirFiltros(page)
  await page.getByLabel('Período', { exact: true }).selectOption('30d')
  await expect(page).toHaveURL(/period=30d/)
  await expect(page.getByRole('region', { name: 'Distribuição do inventário' })).toContainText('Alertas abertos (12)')
  await page.getByRole('button', { name: 'Pendentes', exact: true }).click()
  await expect(page).toHaveURL(/view=pendentes/)
  await abrirFiltros(page)
  await page.getByLabel('Categoria', { exact: true }).selectOption('Tecnologia')
  await expect(page).toHaveURL(/category=Tecnologia/)
  await page.locator('#dashboard-search').fill('notebook')
  await expect(page).toHaveURL(/q=notebook/)
  await expect.poll(() => seen.some((item) => item.url.searchParams.get('q') === 'notebook')).toBe(true)
  const last = seen.filter((item) => item.url.searchParams.get('q') === 'notebook').at(-1)!
  expect(Object.fromEntries(last.url.searchParams)).toEqual({ period: '30d', view: 'pendentes', category: 'Tecnologia', q: 'notebook' })
  expect(seen.some((item) => item.url.searchParams.get('period') === '30d' && !item.url.searchParams.has('category'))).toBe(true)
})

test('BR-07: o intervalo de datas exige as duas datas, em ordem, e só então vai ao BFF', async ({ page }) => {
  const { seen } = await abrir(page)
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible()
  await abrirFiltros(page)
  await page.getByLabel('De', { exact: true }).fill('2026-01-01')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'duas datas' })).toBeVisible()
  await page.getByLabel('Até', { exact: true }).fill('2025-12-01')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'depois da final' })).toBeVisible()
  expect(seen.filter((item) => item.url.searchParams.has('from'))).toHaveLength(0)
  await page.getByLabel('Até', { exact: true }).fill('2026-03-31')
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click()
  await expect(page).toHaveURL(/from=2026-01-01&to=2026-03-31/)
  await expect.poll(() => seen.at(-1)?.url.searchParams.get('from')).toBe('2026-01-01')
  expect(seen.at(-1)!.url.searchParams.get('to')).toBe('2026-03-31')
})

test('URL com filtros inválidos nunca chega ao BFF', async ({ page }) => {
  const { seen } = await abrir(page)
  await page.goto(`${base}/?period=90d&view=tudo&from=2026-05-01&to=2026-01-01`)
  await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible()
  await expect(page.getByRole('alert').filter({ hasText: 'depois da final' })).toBeVisible()
  for (const item of seen.slice(1)) expect(Object.fromEntries(item.url.searchParams)).toEqual({ period: '6m', view: 'todos' })
})

test('estado "ainda não há lote": mensagem clara, sem dados inventados', async ({ page }) => {
  await abrir(page, () => 'event: unavailable\ndata: {"detail":"snapshot not ready"}\n\n')
  await expect(page.getByText('Ainda não há dados processados para este filtro')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Indicadores gerais' })).toHaveCount(0)
  await expect(page.getByRole('status').filter({ hasText: 'Aguardando dados' })).toBeVisible()
})

test('erro 400 do BFF mostra o erro e oferece tentar de novo; 403 encerra a sessão', async ({ page }) => {
  await preparar(page, 'MANAGER', 0, base, false)
  await page.route(OVERVIEW, (route) => route.fulfill({ status: 400, json: { detail: 'period inválido' } }))
  await fazerLogin(page)
  await expect(page.getByRole('alert').filter({ hasText: 'Revise os dados informados.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Indicadores gerais' })).toHaveCount(0)
})

test('403 do BFF encerra a sessão e revoga o refresh token (BR-20)', async ({ page }) => {
  const { escritas } = await preparar(page, 'MANAGER', 0, base, false)
  await page.route(OVERVIEW, (route) => route.fulfill({ status: 403, json: { detail: 'forbidden' } }))
  await page.goto(`${base}/login`)
  await page.locator('#email').fill('pessoa@example.invalid')
  await page.locator('#senha').fill('somente-teste-local')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(`${base}/login`)
  await expect(page.getByText('Sua sessão expirou')).toBeVisible()
  expect(escritas.filter((escrita) => escrita.caminho === '/api/v1/auth/logout')).toHaveLength(1)
})

test('queda do servidor mostra "Reconectando" e mantém o último lote na tela', async ({ page }) => {
  let respostas = 0
  await preparar(page, 'MANAGER', 0, base, false)
  await page.route(OVERVIEW, (route) => {
    respostas += 1
    // O modo estrito do React (dev) monta o efeito duas vezes: a 1ª conexão é descartada, a 2ª é a que a tela usa.
    return respostas <= 2 ? route.fulfill({ contentType: 'text/event-stream', body: snapshotFrame() }) : route.fulfill({ status: 503, json: { detail: 'down' } })
  })
  await fazerLogin(page)
  await expect(page.getByRole('region', { name: 'Indicadores gerais' })).toContainText('1.230')
  await expect(page.getByText('Reconectando: exibindo o último lote recebido.')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByRole('region', { name: 'Indicadores gerais' })).toContainText('1.230')
})

test('snapshot fora do contrato vira erro explícito, sem dados parciais (BR-24)', async ({ page }) => {
  await abrir(page, () => 'event: snapshot\ndata: {"batch_id":"x"}\n\n')
  await expect(page.getByRole('alert').filter({ hasText: 'fora do contrato' })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Indicadores gerais' })).toHaveCount(0)
})

for (const largura of [1440, 320]) {
  test(`axe e rolagem horizontal do dashboard em ${largura}px`, async ({ page }) => {
    await page.setViewportSize({ width: largura, height: 900 })
    await abrir(page)
    await expect(page.getByRole('region', { name: 'Indicadores gerais' })).toBeVisible()
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(resultado.violations.map((violacao) => `${violacao.id}: ${violacao.nodes.map((no) => no.target).join(' ')}`)).toEqual([])
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (largura === 1440) await page.screenshot({ path: 'test-results/dashboard-figma-1440.png', fullPage: false })
  })
}

test('o resumo de filtros aparece na barra superior como no Figma', async ({ page }) => {
  await abrir(page)
  await expect(page.getByLabel('Filtros aplicados')).toHaveText(/Período: últimos 6 meses • Categoria: todas • Situação: todas • Responsável: todos/)
})
