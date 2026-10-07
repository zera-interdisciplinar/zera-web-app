import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { acoesDisponiveisItem, validarTransicaoItem } from '../src/utils/validacaoTransicaoItem'
import type { AcaoItemReal } from '../src/types/transicaoItem'

let busca: ReturnType<typeof vi.fn>
const unidade = 'bb9e2f7d-b386-440a-ab0e-9a3b29fa2222'
beforeEach(async () => {
  vi.stubEnv('VITE_USE_MSW', 'false')
  vi.stubEnv('VITE_INVENTORY_API_URL', 'https://inventory.example.invalid')
  busca = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ id: 'item-1', name: 'Notebook', barcode: 'COD-001', status: 'IN_STOCK', condition: 'USED', model: null, createdAt: '2026-10-07', updatedAt: '2026-10-07' })))
  vi.stubGlobal('fetch', busca)
  const { definirSessaoApi } = await import('../src/services/apiReal')
  definirSessaoApi('token-de-teste', unidade)
})
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

describe('etapas do ciclo do item', () => {
  it.each<AcaoItemReal>(['submit', 'approve', 'maintenance/finish'])('%s usa POST sem corpo nem autoria enviada pelo cliente', async (acao) => {
    const { transicionarItemReal } = await import('../src/services/transicaoItemService')
    await transicionarItemReal('item/1', acao, { reason: '', condition: 'USED' })
    const [url, opcoes] = busca.mock.calls[0]
    expect(url.pathname).toBe(`/api/v1/items/item%2F1/${acao}`)
    expect(url.search).toBe('')
    expect(opcoes.method).toBe('POST')
    expect(opcoes.body).toBeUndefined()
    expect(opcoes.headers).toMatchObject({ Authorization: 'Bearer token-de-teste', 'X-Unit-Id': unidade })
  })
  it('sanitiza e envia apenas o motivo na reprovação e início de manutenção', async () => {
    const { transicionarItemReal } = await import('../src/services/transicaoItemService')
    for (const acao of ['reject', 'maintenance/start'] as const) await transicionarItemReal('item-1', acao, { reason: ' <b>Tela quebrada</b> ', condition: 'USED' })
    for (const chamada of busca.mock.calls) expect(JSON.parse(chamada[1].body)).toEqual({ reason: 'Tela quebrada' })
  })
  it('envia condição e aceita cancelamento na avaliação', async () => {
    const { transicionarItemReal } = await import('../src/services/transicaoItemService')
    const sinal = new AbortController().signal
    await transicionarItemReal('item-1', 'evaluate', { reason: '', condition: 'SEMI_DAMAGED' }, sinal)
    expect(JSON.parse(busca.mock.calls[0][1].body)).toEqual({ condition: 'SEMI_DAMAGED' })
    expect(busca.mock.calls[0][1].signal).toBe(sinal)
  })
  it('bloqueia formulário inválido antes da rede e mantém conflitos de estado', async () => {
    const { transicionarItemReal } = await import('../src/services/transicaoItemService')
    await expect(transicionarItemReal('item-1', 'reject', { reason: ' ', condition: 'USED' })).rejects.toMatchObject({ status: 422, campo: 'reason' })
    expect(busca).not.toHaveBeenCalled()
    busca.mockResolvedValue(new Response('{}', { status: 409 }))
    await expect(transicionarItemReal('item-1', 'submit', { reason: '', condition: 'USED' })).rejects.toMatchObject({ status: 409 })
  })
  it('limita ações por estado e papel; a autorização final permanece no servidor', () => {
    expect(acoesDisponiveisItem('em-aprovacao', 'funcionario')).toEqual([])
    expect(acoesDisponiveisItem('em-aprovacao', 'gestor')).toEqual(['approve', 'reject'])
    expect(acoesDisponiveisItem('rascunho', 'funcionario')).toEqual(['submit'])
    expect(acoesDisponiveisItem('rejeitado', 'gestor')).toEqual(['submit'])
    expect(acoesDisponiveisItem('em-estoque', 'funcionario')).toEqual(['maintenance/start'])
    expect(acoesDisponiveisItem('em-manutencao', 'gestor')).toEqual(['maintenance/finish'])
    expect(acoesDisponiveisItem('aguardando-avaliacao', 'funcionario')).toEqual(['evaluate'])
    expect(acoesDisponiveisItem('descartado', 'gestor')).toEqual([])
    expect(validarTransicaoItem('reject', { reason: 'x'.repeat(501), condition: 'USED' }).valido).toBe(false)
  })
})
