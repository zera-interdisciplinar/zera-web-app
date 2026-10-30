import { expect, it } from 'vitest'
import { mapearItem } from '../src/services/mapeadoresApi'
import type { ItemResponse } from '../src/types/apiReal'

it('data inválida não vira zero dias de estoque', () => {
  const item: ItemResponse = {
    id: 'item-local', unitId: 'unidade-local', barcode: 'ETQ-001', displayCode: null,
    name: null, status: 'DRAFT', condition: null, model: null, createdByName: null,
    createdAt: 'data-invalida', updatedAt: '2026-10-29T12:00:00Z',
  }
  expect(() => mapearItem(item)).toThrow('Não conseguimos ler a data')
})
