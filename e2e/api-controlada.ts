import { expect } from '@playwright/test'
import type { Page } from '@playwright/test'

export const base = 'http://127.0.0.1:5184'
const unidade = '22222222-2222-4222-8222-222222222222'
const pessoa = '11111111-1111-4111-8111-111111111111'
const categoriaId = '33333333-3333-4333-8333-333333333333'
const modeloId = '44444444-4444-4444-8444-444444444444'

export async function preparar(page: Page, role = 'MANAGER', peso = 0, endereco = base) {
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
    if (!['localhost', '127.0.0.1', new URL(endereco).hostname].includes(url.hostname)) return route.abort()
    if (!url.pathname.startsWith('/api/')) return route.fallback()
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
    if (caminho === '/api/v1/recyclings') return route.fulfill({ json: [] })
    return route.fulfill({ status: 503, json: {} })
  })
  await page.goto(`${endereco}/login`)
  await page.locator('#email').fill('pessoa@example.invalid')
  await page.locator('#senha').fill('somente-teste-local')
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await expect(page).toHaveURL(`${endereco}/`)
  return { escritas, leituras }
}

