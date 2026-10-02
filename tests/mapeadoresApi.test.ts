import { describe, expect, it } from 'vitest'
import { mapearCategoria, mapearItem, mapearModelo } from '../src/services/mapeadoresApi'
import type { CategoryResponse, ItemResponse, ModelResponse } from '../src/types/apiReal'

const categoria: CategoryResponse = {
  id: '11111111-1111-4111-8111-111111111111',
  unitId: '22222222-2222-4222-8222-222222222222',
  name: 'Computadores',
  description: 'Equipamentos de informática',
}

const modelo: ModelResponse = {
  id: '33333333-3333-4333-8333-333333333333',
  unitId: categoria.unitId,
  name: 'Modelo de teste',
  manufacturer: 'Fabricante',
  expectedLifespanMonths: 60,
  warrantyMonths: 12,
  materials: [],
  notes: null,
  category: categoria,
  approvalStatus: 'APPROVED',
}

function item(status: ItemResponse['status']): ItemResponse {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    barcode: 'COD-001',
    displayCode: null,
    name: 'Item de teste',
    status,
    condition: 'SEMI_DAMAGED',
    unitId: categoria.unitId,
    model: modelo,
    createdByName: 'Pessoa de teste',
    createdAt: '2026-01-01T10:00:00Z',
    updatedAt: '2026-01-02T10:00:00Z',
  }
}

describe('mapeamento do OpenAPI de inventário', () => {
  it('preserva UUID e categoria do contrato', () => {
    expect(mapearCategoria(categoria).id).toBe(categoria.id)
    expect(mapearModelo(modelo).categoriaId).toBe(categoria.id)
    expect(mapearItem(item('IN_STOCK')).id).toBe('44444444-4444-4444-8444-444444444444')
  })

  it.each([
    ['DRAFT', 'rascunho'],
    ['PENDING_APPROVAL', 'em-aprovacao'],
    ['REJECTED', 'rejeitado'],
    ['IN_STOCK', 'em-estoque'],
    ['IN_MAINTENANCE', 'em-manutencao'],
    ['AWAITING_EVALUATION', 'aguardando-avaliacao'],
    ['DISPOSED', 'descartado'],
    ['REMOVED', 'removido'],
  ] as const)('traduz %s sem perder o estado', (estado, esperado) => {
    expect(mapearItem(item(estado)).status).toBe(esperado)
  })

  it('preserva condição semidanificada e código de barras', () => {
    const mapeado = mapearItem(item('IN_STOCK'))
    expect(mapeado.condicao).toBe('semidanificado')
    expect(mapeado.codigoBarras).toBe('COD-001')
  })
})
