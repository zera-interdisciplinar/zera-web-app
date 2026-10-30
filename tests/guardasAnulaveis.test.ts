import { expect, it } from 'vitest'
import { lerCategoriaApi } from '../src/utils/guardaCategoriaApi'
import { lerMaterialApi, lerModeloApi } from '../src/utils/guardaModeloApi'
import { lerDescarteApi } from '../src/utils/guardaDescarteApi'
import { lerItemApi } from '../src/utils/guardaItemApi'

const categoria = { id: 'c', unitId: 'u', name: 'Categoria' }
const material = { id: 'm', code: 'METAL', name: 'Metal', recyclable: true, hazardous: false }
const modelo = { id: 'mod', unitId: 'u', name: 'Modelo', manufacturer: 'Marca', materials: [material], category: categoria, approvalStatus: 'APPROVED' }
const descarte = { id: 'd', unitId: 'u', destination: 'RECYCLING', disposedAt: '2026-10-29', createdAt: '2026-10-29', items: [{ itemId: 'i' }], totalWeightKg: 0 }
const item = { id: 'i', unitId: 'u', barcode: 'cod', status: 'DRAFT', createdAt: '2026-10-29', updatedAt: '2026-10-29', model: modelo }

it('normaliza campos omitidos e preserva nulos em respostas aninhadas', () => {
  expect(lerCategoriaApi(categoria).description).toBeNull()
  expect(lerCategoriaApi({ ...categoria, description: null }).description).toBeNull()
  expect(lerMaterialApi(material).disposalGuide).toBeNull()
  expect(lerModeloApi(modelo)).toMatchObject({ warrantyMonths: null, expectedLifespanMonths: null, estimatedWeightKg: null, notes: null, category: { description: null }, materials: [{ disposalGuide: null }] })
  expect(lerItemApi(item).model?.category.description).toBeNull()
  expect(lerDescarteApi(descarte)).toMatchObject({ placeId: null, placeName: null, notes: null, createdByName: null, items: [{ displayCode: null, name: null, weightKg: null }] })
})

it.each([
  () => lerCategoriaApi({ ...categoria, id: undefined }),
  () => lerMaterialApi({ ...material, recyclable: undefined }),
  () => lerModeloApi({ ...modelo, unitId: undefined }),
  () => lerModeloApi({ ...modelo, warrantyMonths: '12' }),
  () => lerDescarteApi({ ...descarte, totalWeightKg: undefined }),
  () => lerDescarteApi({ ...descarte, createdAt: 'ontem' }),
  () => lerItemApi({ ...item, barcode: '' }),
  () => lerItemApi({ ...item, status: '' }),
])('rejeita campos essenciais ou tipos inválidos', validar => {
  expect(validar).toThrow('Tente novamente')
})
