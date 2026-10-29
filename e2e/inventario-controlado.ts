import type { Page } from '@playwright/test'

const unit = '22222222-2222-4222-8222-222222222222'
const person = '11111111-1111-4111-8111-111111111111'
const ISO = '2026-10-28T14:12:00'

export const categories = [
  { id: 'cat-eletronicos', unitId: unit, name: 'Eletrônicos', description: 'Equipamentos usados' },
  { id: 'cat-moveis', unitId: unit, name: 'Móveis', description: 'Mobiliário' },
  { id: 'cat-vazia', unitId: unit, name: 'Sem uso', description: 'Nenhum modelo usa' },
]
const materials = [{ id: 'm1', code: 'PLASTIC', name: 'Plástico', recyclable: true, hazardous: false }, { id: 'm2', code: 'METAL', name: 'Metal', recyclable: true, hazardous: false }]
export const models = [
  { id: 'model-1', unitId: unit, name: 'ThinkPad T14', manufacturer: 'Lenovo', materials, category: categories[0], approvalStatus: 'APPROVED' },
  { id: 'model-2', unitId: unit, name: 'Cadeira Ergo', manufacturer: 'Flexform', materials: [materials[0]], category: categories[1], approvalStatus: 'APPROVED' },
  { id: 'model-3', unitId: unit, name: 'Modelo sem itens', manufacturer: 'Acme', materials: [materials[1]], category: categories[1], approvalStatus: 'PENDING', warrantyMonths: 12 },
]

export interface Write { method: string; path: string; body: Record<string, unknown> | undefined }
type Stored = Record<string, unknown> & { id: string; status: string; name: string | null }

export interface Inventory {
  items: Stored[]
  categories: typeof categories
  models: Array<Record<string, unknown> & { id: string }>
  settings: { unitId: string; stockCapacity: number | null; configured: boolean; updatedByName?: string; updatedAt?: string }
  writes: Write[]
  /** Query strings of every GET /items, in order. */
  lists: URLSearchParams[]
  /** Next response for the matching write, to force a server error: `fail['POST /approve'] = 409`. */
  fail: Record<string, number>
}

function base(over: Record<string, unknown>): Stored {
  return {
    barcode: `BAR-${over.id}`, displayCode: `ZR-${String(over.id).replace(/\D/g, '').padStart(4, '0')}`, condition: 'USED', hasDamages: false, damages: [], usageIntensity: 3, unitId: unit,
    model: models[0], createdBy: person, createdByName: 'Pessoa local', createdAt: ISO, updatedAt: ISO, ...over,
  } as Stored
}

export function seed(): Stored[] {
  // The special ones come first, so they are on the first page of the list.
  const items: Stored[] = [
    base({ id: 'item-pending', name: 'Tablet pendente', status: 'PENDING_APPROVAL', model: models[1] }),
    base({ id: 'item-draft', name: 'Monitor rascunho', status: 'DRAFT', usageIntensity: null, missingFields: ['usageIntensity'] }),
    base({ id: 'item-removed', name: 'Impressora removida', status: 'REMOVED' }),
  ]
  for (let i = 1; i <= 45; i += 1) items.push(base({ id: `item-${i}`, name: `Item ${String(i).padStart(2, '0')}`, status: 'IN_STOCK' }))
  return items
}

/** A small stateful ms-inventory: enough of the contract for the item screens. Register it after `preparar` (later routes win). */
export async function controlarInventario(page: Page): Promise<Inventory> {
  const inventory: Inventory = {
    items: seed(), categories: structuredClone(categories), models: structuredClone(models) as Inventory['models'], writes: [], lists: [], fail: {},
    settings: { unitId: unit, stockCapacity: null, configured: false },
  }
  const json = (body: unknown, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) })
  const problem = (status: number, extra: Record<string, unknown> = {}) => json({ status, title: 'Erro', detail: 'detalhe interno', ...extra }, status)

  await page.route('**/api/inventory/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/inventory', '')
    const method = request.method()
    const body = request.postData() ? (request.postDataJSON() as Record<string, unknown>) : undefined
    if (method !== 'GET') inventory.writes.push({ method, path, body })

    const failKey = `${method} ${path.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/, ':id')}`
    const forcedStatus = inventory.fail[failKey]
    if (forcedStatus && method !== 'GET') { delete inventory.fail[failKey]; return route.fulfill(problem(forcedStatus)) }

    if (path === '/api/v1/unit-settings') {
      if (method === 'PUT') Object.assign(inventory.settings, { stockCapacity: body?.stockCapacity, configured: true, updatedByName: 'Pessoa local', updatedAt: ISO })
      return route.fulfill(json(inventory.settings))
    }
    if (path === '/api/v1/materials') return route.fulfill(json(materials))

    if (path === '/api/v1/categories') {
      if (method === 'POST') { const created = { id: crypto.randomUUID(), unitId: unit, ...body } as (typeof categories)[number]; inventory.categories.push(created); return route.fulfill(json(created, 201)) }
      return route.fulfill(json(inventory.categories))
    }
    const categoryMatch = path.match(/^\/api\/v1\/categories\/([^/]+)(?:\/(name|description))?$/)
    if (categoryMatch) {
      const category = inventory.categories.find((candidate) => candidate.id === categoryMatch[1])
      if (!category) return route.fulfill(problem(404))
      if (method === 'DELETE') {
        if (inventory.models.some((model) => (model.category as { id: string }).id === category.id)) return route.fulfill(problem(409))
        inventory.categories.splice(inventory.categories.indexOf(category), 1)
        return route.fulfill({ status: 204 })
      }
      Object.assign(category, body)
      return route.fulfill(json(category))
    }

    if (path === '/api/v1/models') {
      if (method === 'POST') {
        const created = { id: crypto.randomUUID(), unitId: unit, approvalStatus: 'PENDING', ...body, category: inventory.categories.find((c) => c.id === body?.categoryId), materials: materials.filter((m) => (body?.materials as string[]).includes(m.code)) }
        inventory.models.push(created)
        return route.fulfill(json(created, 201))
      }
      const size = Number(url.searchParams.get('size') ?? 20)
      const pageNumber = Number(url.searchParams.get('page') ?? 0)
      const approval = url.searchParams.get('approvalStatus')
      inventory.lists.push(url.searchParams)
      const matches = inventory.models.filter((model) => !approval || model.approvalStatus === approval)
      return route.fulfill(json({ content: matches.slice(pageNumber * size, (pageNumber + 1) * size), page: pageNumber, size, totalElements: matches.length, totalPages: Math.max(1, Math.ceil(matches.length / size)) }))
    }
    const modelMatch = path.match(/^\/api\/v1\/models\/([^/]+)(?:\/([a-z-]+))?$/)
    if (modelMatch) {
      const model = inventory.models.find((candidate) => candidate.id === modelMatch[1])
      if (!model) return route.fulfill(problem(404))
      const [, , sub] = modelMatch
      if (method === 'GET' && sub === 'items') {
        const linked = inventory.items.filter((item) => (item.model as { id: string } | null)?.id === model.id).slice(0, 20)
        return route.fulfill(json({ content: linked, page: 0, size: 20, totalElements: linked.length, totalPages: Math.max(1, Math.ceil(linked.length / 20)) }))
      }
      if (method === 'GET') return route.fulfill(json(model))
      if (method === 'DELETE') {
        if (inventory.items.some((item) => (item.model as { id: string } | null)?.id === model.id)) return route.fulfill(problem(409))
        inventory.models.splice(inventory.models.indexOf(model), 1)
        return route.fulfill({ status: 204 })
      }
      if (sub === 'materials') model.materials = materials.filter((m) => (body?.materials as string[]).includes(m.code))
      else Object.assign(model, body)
      return route.fulfill(json(model))
    }

    if (path === '/api/v1/items' && method === 'GET') {
      inventory.lists.push(url.searchParams)
      const size = Number(url.searchParams.get('size') ?? 20)
      const pageNumber = Number(url.searchParams.get('page') ?? 0)
      const status = url.searchParams.get('status')
      const q = url.searchParams.get('q')?.toLowerCase()
      const category = url.searchParams.get('categoryId')
      const matches = inventory.items.filter((item) =>
        (status ? item.status === status : item.status !== 'REMOVED' && item.status !== 'DISPOSED')
        && (!q || String(item.name).toLowerCase().includes(q) || String(item.displayCode).toLowerCase().includes(q))
        && (!category || (item.model as { category: { id: string } }).category.id === category))
      return route.fulfill(json({ content: matches.slice(pageNumber * size, (pageNumber + 1) * size), page: pageNumber, size, totalElements: matches.length, totalPages: Math.max(1, Math.ceil(matches.length / size)) }))
    }

    if (path === '/api/v1/items' && method === 'POST') {
      const forced = inventory.fail['POST /items']
      if (forced) { delete inventory.fail['POST /items']; return route.fulfill(problem(forced)) }
      const existing = inventory.items.find((item) => item.id === body?.id)
      if (existing) return route.fulfill(json(existing))
      if (inventory.items.some((item) => item.barcode === body?.barcode)) return route.fulfill(problem(409))
      const model = body?.modelId ? inventory.models.find((candidate) => candidate.id === body.modelId) : { id: 'model-new', ...(body?.model as object), category: inventory.categories.find((c) => c.id === (body?.model as { categoryId: string }).categoryId), materials, approvalStatus: 'PENDING' }
      const created = base({ ...body, id: body?.id, status: 'DRAFT', displayCode: 'ZR-9999', model, missingFields: [] })
      inventory.items.unshift(created)
      return route.fulfill(json(created, 201))
    }

    const match = path.match(/^\/api\/v1\/items\/([^/]+)(\/[a-z]+)?$/)
    if (!match) return route.fulfill(problem(503))
    const [, id, action = ''] = match
    const item = inventory.items.find((candidate) => candidate.id === decodeURIComponent(id))
    if (!item) return route.fulfill(problem(404))
    const key = `${method} ${action || '/item'}`
    const forced = inventory.fail[key]
    if (forced && method !== 'GET') { delete inventory.fail[key]; return route.fulfill(problem(forced, forced === 422 ? { missingFields: ['usageIntensity'] } : {})) }

    if (method === 'GET' && action === '/events') {
      return route.fulfill(json({ content: [{ id: 'ev-1', itemId: item.id, type: 'CREATED', toStatus: 'DRAFT', actorName: 'Pessoa local', occurredAt: ISO }, { id: 'ev-2', itemId: item.id, type: 'SUBMITTED', fromStatus: 'DRAFT', toStatus: 'PENDING_APPROVAL', reason: null, actorName: 'Pessoa local', occurredAt: ISO }], page: 0, size: 20, totalElements: 2, totalPages: 1 }))
    }
    if (method === 'GET') return route.fulfill(json(item))
    if (method === 'DELETE') { item.status = 'REMOVED'; return route.fulfill({ status: 204 }) }
    if (method === 'PATCH') { Object.assign(item, body, { updatedAt: ISO }); if (body?.serialNumber === '') delete item.serialNumber; return route.fulfill(json(item)) }
    if (action === '/submit') {
      if (item.usageIntensity == null) return route.fulfill(problem(422, { missingFields: ['usageIntensity'] }))
      item.status = 'IN_STOCK'; item.missingFields = []
    }
    if (action === '/approve') item.status = 'IN_STOCK'
    if (action === '/reject') item.status = 'REJECTED'
    if (action === '/restore') item.status = 'IN_STOCK'
    return route.fulfill(json(item))
  })
  return inventory
}
