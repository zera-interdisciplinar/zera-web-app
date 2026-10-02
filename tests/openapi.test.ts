import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

interface Operacao { parameters?: Array<{ name: string; required?: boolean }>; requestBody?: { content: Record<string, { schema: { $ref: string } }> } }
interface Contrato { paths: Record<string, Record<string, Operacao>>; schemas: Record<string, { properties?: Record<string, { enum?: string[] }>; required?: string[] }> }
const contrato = JSON.parse(readFileSync(new URL('./fixtures/inventory-contract.json', import.meta.url), 'utf8').replace(/^\uFEFF/, '')) as Contrato

describe('snapshot do OpenAPI consultado em 02/10/2026', () => {
  it.each([
    ['/api/v1/items', 'get'], ['/api/v1/items/{id}', 'patch'], ['/api/v1/items/{id}/events', 'get'],
    ['/api/v1/items/by-barcode/{barcode}', 'get'], ['/api/v1/disposals', 'get'],
    ['/api/v1/unit-settings', 'get'], ['/api/v1/categories', 'post'], ['/api/v1/models', 'get'],
  ])('%s %s existe e exige unidade', (path, method) => {
    expect(contrato.paths[path][method].parameters).toContainEqual(expect.objectContaining({ name: 'X-Unit-Id', required: true }))
  })
  it('edição usa UpdateItemRequest, categoria exige nome e descrição', () => {
    expect(contrato.paths['/api/v1/items/{id}'].patch.requestBody?.content['application/json'].schema.$ref).toBe('#/components/schemas/UpdateItemRequest')
    expect(contrato.schemas.CreateCategoryRequest.required).toEqual(expect.arrayContaining(['name', 'description']))
  })
  it('o contrato não oferece categoryId como filtro de modelos', () => {
    expect(contrato.paths['/api/v1/models'].get.parameters?.some((item) => item.name === 'categoryId')).toBe(false)
  })
  it('todos os estados do item foram considerados pelo frontend', () => {
    expect(contrato.schemas.ItemResponse.properties?.status.enum).toEqual(['DRAFT', 'PENDING_APPROVAL', 'REJECTED', 'IN_STOCK', 'IN_MAINTENANCE', 'AWAITING_EVALUATION', 'DISPOSED', 'REMOVED'])
  })
})
