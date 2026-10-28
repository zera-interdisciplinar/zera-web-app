import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'

const base = 'http://127.0.0.1:5184'
const unidade = '22222222-2222-4222-8222-222222222222'
const pessoa = '11111111-1111-4111-8111-111111111111'
const categoriaId = '33333333-3333-4333-8333-333333333333'
const modeloId = '44444444-4444-4444-8444-444444444444'

async function preparar(page: Page, role = 'MANAGER', peso = 0) {
  const categorias = [{ id: categoriaId, unitId: unidade, name: 'Eletrônicos', description: 'Equipamentos usados' }]
  const materiais = [{ id: 'plastico', code: 'PLASTIC', name: 'Plástico', recyclable: true, hazardous: false, disposalGuide: null }, { id: 'outro', code: 'OTHER', name: 'Outro', recyclable: false, hazardous: false, disposalGuide: null }]
  const modelos = Array.from({ length: 25 }, (_, i) => ({ id: i === 0 ? modeloId : `modelo-${i}`, unitId: unidade, name: `Modelo ${i + 1}`, manufacturer: 'Fabricante', category: categorias[0], materials: [materiais[0]], expectedLifespanMonths: null, warrantyMonths: null, approvalStatus: i % 2 ? 'PENDING_APPROVAL' : 'APPROVED', notes: null }))
  const item = { id: 'item-proprio', unitId: unidade, barcode: 'ETQ-001', displayCode: 'ETQ-001', name: 'Notebook próprio', model: modelos[0], condition: 'USED', status: 'DRAFT', createdBy: pessoa, createdByName: 'Pessoa local', createdAt: '2026-10-28T14:12:00', updatedAt: '2026-10-28T14:12:00' }
  const itens = [item, { ...item, id: 'item-outro', name: 'Item de outra pessoa', createdBy: 'outra-pessoa', createdByName: 'Outra pessoa' }, { ...item, id: 'item-nulo', name: null, model: null, condition: null, createdByName: null }]
  const escritas: Array<{ caminho: string; corpo: Record<string, unknown> }> = []
  const leituras: string[] = []
  await page.route('**/*', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.continue()
    const caminho = url.pathname.replace(/^\/api\/(administrative|inventory|analytics)/, '')
    const post = req.method() === 'POST'
    const corpo = post ? req.postDataJSON() : undefined
    if (post) escritas.push({ caminho, corpo })
    else leituras.push(caminho)
    if (caminho === '/api/v1/auth/login') return route.fulfill({ json: { userId: pessoa, accessToken: 'sessao-sintetica', refreshToken: 'renovacao-sintetica', expiresIn: 3600 } })
    if (caminho === `/api/v1/users/${pessoa}`) return route.fulfill({ json: { userId: pessoa, unitId: unidade, name: 'Pessoa local', email: 'pessoa@example.invalid', role } })
    if (caminho === '/api/v1/categories') {
      if (post) { const nova = { id: crypto.randomUUID(), unitId: unidade, ...corpo }; categorias.push(nova); return route.fulfill({ status: 201, json: nova }) }
      return route.fulfill({ json: categorias })
    }
    if (caminho === '/api/v1/materials') return route.fulfill({ json: materiais })
    if (caminho === '/api/v1/models') {
      if (post) {
        const novo = { ...modelos[0], ...corpo, id: crypto.randomUUID(), category: categorias.find((c) => c.id === corpo.categoryId), materials: materiais.filter((m) => corpo.materials.includes(m.code)) }
        modelos.push(novo)
        return route.fulfill({ status: 201, json: novo })
      }
      const pagina = Number(url.searchParams.get('page') ?? 0)
      return route.fulfill({ json: { content: modelos.slice(pagina * 20, (pagina + 1) * 20), page: pagina, size: 20, totalPages: Math.ceil(modelos.length / 20), totalElements: modelos.length } })
    }
    if (caminho === '/api/v1/items') {
      expect(req.headers()['x-unit-id']).toBe(unidade)
      if (post) { const novo = { ...item, ...corpo, id: crypto.randomUUID(), model: modelos.find((m) => m.id === corpo.modelId) }; itens.push(novo); return route.fulfill({ status: 201, json: novo }) }
      return route.fulfill({ json: { content: itens, page: 0, size: 20, totalPages: 1, totalElements: itens.length } })
    }
    if (caminho.endsWith('/events')) return route.fulfill({ json: { content: [{ id: 'evento', itemId: item.id, type: 'CREATED', fromStatus: null, toStatus: 'DRAFT', actorId: pessoa, actorName: 'Pessoa local', occurredAt: item.createdAt, reason: null }], totalElements: 1, totalPages: 1 } })
    if (caminho.startsWith('/api/v1/items/')) return route.fulfill({ json: itens.find((i) => i.id === caminho.split('/').pop()) ?? item })
    if (caminho === '/api/v1/dashboard/home') return route.fulfill({ json: { activeItems: 3, activeItemsChangePercent: null, pendingApproval: 1, inMaintenance: 0, awaitingEvaluation: 0, disposalsInWindow: peso ? 1 : 0 } })
    if (caminho === '/api/v1/dashboard/indicators') return route.fulfill({ json: { totalWeightKg: peso, recyclingRatePercent: null, recyclingRateChangePoints: null, totalWeightChangePercent: null, monthlyWeightKg: [{ month: '2026-09', weightKg: 0 }, { month: '2026-10', weightKg: peso }] } })
    if (caminho === '/api/v1/disposals') return route.fulfill({ json: { content: [], totalPages: 0, totalElements: 0 } })
    if (caminho === '/api/v1/recycling-places') return route.fulfill({ json: [] })
    return route.fulfill({ status: 503, json: {} })
  })
  await page.goto(`${base}/login`)
  await page.locator('#email').fill('pessoa@example.invalid')
  await page.locator('#senha').fill('somente-teste-local')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(`${base}/`)
  return { escritas, leituras }
}

async function axe(page: Page) {
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(resultado.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([])
}

test('gestor: categorias, todos os modelos, validação, limites e Outro', async ({ page }) => {
  const { escritas } = await preparar(page)
  await page.getByRole('link', { name: 'Modelos', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Todos os modelos (25 modelos)', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'Modelo 25', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar categoria', exact: true }).click()
  await page.locator('#categoria-nome').fill('Eletrônicos usados')
  await page.locator('#categoria-descricao').fill('Para reaproveitar')
  await page.getByRole('button', { name: 'Salvar categoria', exact: true }).click()
  await page.locator('#busca-modelos').fill('ELETRONICOS USADOS')
  const categoria = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Eletrônicos usados', exact: true }) })
  await expect(categoria).toContainText('Nenhum modelo nesta categoria ainda')
  await categoria.getByRole('button', { name: 'Adicionar modelo' }).click()
  await page.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(page.locator('#modelo-nome')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#modelo-nome')).toBeFocused()
  await page.locator('#modelo-nome').fill('Modelo novo')
  await page.locator('#modelo-fabricante').fill('Fabricante novo')
  await page.locator('#modelo-vida-util').pressSequentially('-2617')
  await expect(page.locator('#modelo-vida-util')).toHaveValue('600')
  await page.locator('#modelo-vida-util').fill('')
  await page.getByRole('checkbox', { name: 'Outro', exact: true }).check()
  await page.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(page.locator('#modelo-outro-material')).toHaveAttribute('aria-invalid', 'true')
  await page.locator('#modelo-outro-material').fill('Borracha')
  await axe(page)
  await page.screenshot({ path: 'test-results/modelo-outro.png', fullPage: true })
  await page.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(escritas.find((e) => e.caminho === '/api/v1/models')?.corpo).toMatchObject({ materials: ['OTHER'], notes: 'Outro material: Borracha' })
})

test('item: criação no cadastro, sucesso, histórico traduzido e cancelar edição', async ({ page }) => {
  await preparar(page)
  await page.getByRole('link', { name: 'Itens', exact: true }).click()
  await expect(page.getByText('Notebook próprio', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Adicionar item', exact: true }).click()
  await page.locator('#item-nome').fill('Item criado no teste')
  await page.locator('#item-material').selectOption('__nova__')
  await page.locator('#categoria-rapida-nome').fill('Categoria rápida')
  await page.locator('#categoria-rapida-descricao').fill('Criada sem sair do item')
  await page.getByRole('button', { name: 'Salvar categoria', exact: true }).click()
  await expect(page.locator('#item-material option:checked')).toHaveText('Categoria rápida')
  await page.locator('#item-modelo').selectOption('__novo__')
  await page.locator('#modelo-nome').fill('Modelo rápido')
  await page.locator('#modelo-fabricante').fill('Fabricante')
  await page.getByRole('checkbox', { name: 'Plástico', exact: true }).check()
  await page.getByRole('button', { name: 'Concluir cadastro', exact: true }).last().click()
  await expect(page.locator('#item-modelo option:checked')).toHaveText('Fabricante Modelo rápido')
  await page.locator('#item-intensidade').selectOption('3')
  await page.locator('#item-tem-danos').selectOption('nao')
  await page.locator('#item-condicao').selectOption('usado')
  await page.getByRole('button', { name: 'Concluir cadastro', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Item cadastrado', exact: true })).toBeFocused()
  await page.getByRole('link', { name: 'Ver item', exact: true }).click()
  await page.getByRole('button', { name: 'Editar item', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Salvar alterações', exact: true })).toBeDisabled()
  await page.locator('#api-item-nome').fill('Mudança descartada')
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Descartar alterações?' })).toBeVisible()
  await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Editar item' })).toBeFocused()
  await page.getByRole('tab', { name: 'Eventos' }).click()
  await expect(page.getByText('Item cadastrado', { exact: false })).toBeVisible()
  await expect(page.getByText('CREATED', { exact: true })).toHaveCount(0)
  await axe(page)
  await page.screenshot({ path: 'test-results/item-historico.png', fullPage: true })
})

test('funcionário: só itens próprios, sem nomes alheios, inclusive no painel e detalhe', async ({ page }) => {
  const { leituras } = await preparar(page, 'EMPLOYEE')
  await expect(page.getByRole('heading', { name: 'Meus itens' })).toBeVisible()
  await expect(page.getByText('Item de outra pessoa', { exact: true })).toHaveCount(0)
  expect(leituras.some((p) => p.includes('/dashboard/'))).toBe(false)
  await page.getByRole('link', { name: 'Itens', exact: true }).click()
  await expect(page.getByText('Notebook próprio', { exact: true })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Cadastrado por' })).toHaveCount(0)
  await expect(page.locator('#conteudo')).not.toContainText('Outra pessoa')
  await page.getByRole('button', { name: 'Adicionar item' }).click()
  await expect(page.locator('#item-material option[value="__nova__"]')).toHaveCount(0)
  await page.keyboard.press('Escape')
  await page.evaluate(() => { history.pushState(null, '', '/itens/item-outro'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page.getByRole('alert')).toContainText('Este item não está disponível para sua conta.')
})

for (const peso of [0, 12.5]) test(`painel com peso ${peso}, modo foco, navegação e 320 px`, async ({ page }) => {
  await preparar(page, 'MANAGER', peso)
  if (peso === 0) await expect(page.getByText('Nenhum descarte registrado nos últimos 12 meses')).toBeVisible()
  else { await expect(page.getByRole('img', { name: /Peso mensal/ })).toBeVisible(); await page.getByText('Ver em tabela').click(); await expect(page.getByRole('cell', { name: '12,5', exact: true })).toBeVisible() }
  await page.evaluate(() => document.documentElement.dataset.modoFoco = 'ativo')
  for (const nome of ['Itens', 'Modelos', 'Locais de reciclagem', 'Descartes']) {
    await page.getByRole('link', { name: nome, exact: true }).click()
    await expect(page.getByRole('navigation', { name: 'Seções do sistema' })).toBeVisible()
  }
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click()
  await axe(page)
  await page.setViewportSize({ width: 320, height: 800 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `test-results/painel-${peso}-320.png`, fullPage: true })
})

test('demonstração pública permanece identificada e isolada', async ({ page }) => {
  page.on('pageerror', (error) => console.log('DEMO ERROR:', error.message))
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('DEMO CONSOLE:', msg.text()) })
  await page.route('https://**/*', (route) => route.abort())
  await page.goto('http://127.0.0.1:5183/demonstracao')
  await expect(page.getByRole('heading', { name: 'Painel de demonstração' })).toBeVisible()
  await expect(page.getByText('DEMONSTRAÇÃO', { exact: true }).first()).toBeVisible()
  await axe(page)
  await page.screenshot({ path: 'test-results/demonstracao.png', fullPage: true })
})
