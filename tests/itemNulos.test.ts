import { expect, it } from 'vitest'
import { lerItemApi } from '../src/utils/guardaItemApi'
const essencial = { id: 'item', unitId: 'unidade', barcode: 'etiqueta', model: null, status: 'DRAFT', createdAt: '2026-10-29T10:00:00Z', updatedAt: '2026-10-29T10:00:00Z' }
it('normaliza campos anuláveis omitidos', () => {
  expect(lerItemApi(essencial)).toMatchObject({ displayCode: null, name: null, createdByName: null, createdBy: null, condition: null })
})
it.each(['id', 'unitId', 'status', 'barcode', 'createdAt', 'updatedAt'])('rejeita campo essencial ausente: %s', campo => {
  const incompleto = { ...essencial, [campo]: undefined }
  expect(() => lerItemApi(incompleto)).toThrow('Tente novamente')
})
