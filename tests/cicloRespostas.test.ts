import { expect, it } from 'vitest'
import { lerEventoApi, lerCapacidadeApi } from '../src/utils/guardaCicloApi'
import { rotuloEvento } from '../src/utils/eventos'

const evento = { id: 'evento', itemId: 'item', type: 'CREATED', occurredAt: '2026-10-29T10:00:00Z' }
it('normaliza campos anuláveis e apresenta evento desconhecido sem código técnico', () => {
  expect(lerEventoApi(evento)).toMatchObject({ fromStatus: null, toStatus: null, reason: null, actorId: null, actorName: null })
  expect(rotuloEvento(lerEventoApi({ ...evento, type: 'FUTURO' }))).toBe('Atividade registrada')
  expect(lerCapacidadeApi({ unitId: 'u', configured: false, stockCapacity: null })).toMatchObject({ stockCapacity: null, updatedAt: null })
})
it.each([null, {}, { ...evento, id: undefined }, { ...evento, occurredAt: 'ontem' }, { ...evento, type: 1 }])('recusa evento inválido %j', valor => {
  expect(() => lerEventoApi(valor)).toThrow('Tente novamente')
})
it.each([null, {}, { unitId: 'u', configured: 'sim' }, { unitId: 'u', configured: true, stockCapacity: '10' }])('recusa capacidade inválida %j', valor => {
  expect(() => lerCapacidadeApi(valor)).toThrow('Tente novamente')
})
