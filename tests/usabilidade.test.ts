import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatarDataRelativa } from '../src/utils/formatacao'
import { normalizarBusca } from '../src/utils/busca'
import { LIMITES, limitarNumero } from '../src/utils/limitesNumericos'
import { rotuloEvento } from '../src/utils/eventos'
import { ROTULO_STATUS } from '../src/types/produto'
import { ROTULO_TRANSICAO } from '../src/types/transicaoItem'
import { itemVisivel } from '../src/utils/escopoItens'
import { mapearItem } from '../src/services/mapeadoresApi'
import type { ItemResponse } from '../src/types/apiReal'
import type { Usuario } from '../src/types/usuario'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PesoMensal } from '../src/components/PesoMensal'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules() })

describe('regressões de usabilidade', () => {
  it('pesquisa sem acentos e sem diferença de caixa', () => {
    expect(normalizarBusca(' Eletrônicos usados ')).toBe(normalizarBusca('ELETRONICOS USADOS'))
  })
  it.each(['2026-10-28T14:12:00Z', '2026-10-28T14:12:00', '2026-10-28T11:12:00-03:00'])('converte %s para São Paulo independentemente do TZ do processo', (iso) => {
    expect(formatarDataRelativa(iso, new Date('2026-10-28T18:00:00Z'), 'America/Sao_Paulo')).toBe('Hoje, 11:12')
  })
  it('calcula Ontem pelo dia civil no fuso do usuário, inclusive na virada UTC', () => {
    expect(formatarDataRelativa('2026-10-28T02:50:00Z', new Date('2026-10-28T03:10:00Z'), 'America/Sao_Paulo')).toBe('Ontem, 23:50')
  })
  it('bloqueia negativos, expoentes e decimais inteiros; limita excesso e aceita vazio', () => {
    for (const texto of ['-2617', '+3', '1e2', '1.5', '1,5']) expect(limitarNumero(texto, LIMITES.meses)).toBeNull()
    expect(limitarNumero('2617', LIMITES.meses)).toBe('600')
    expect(limitarNumero('', LIMITES.meses)).toBe('')
    expect(limitarNumero('12,5', LIMITES.peso)).toBe('12.5')
  })
  it.each(['CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'MAINTENANCE_STARTED', 'MAINTENANCE_FINISHED', 'EVALUATED', 'DISPOSED', 'REMOVED', 'RESTORED', 'LOAN_STARTED', 'LOAN_RETURNED', 'DISPOSAL_CANCELLED', 'STATUS_CHANGED'] as const)('traduz o evento %s', (type) => {
    expect(rotuloEvento({ type, fromStatus: 'DRAFT', toStatus: 'IN_STOCK' })).not.toContain(type)
  })
  it('mostra status e eventos de empréstimo e cancelamento em texto humano', () => {
    expect(ROTULO_STATUS['em-uso']).toBe('Em uso')
    expect(ROTULO_TRANSICAO.lend).toBe('Registrar empréstimo')
    expect(ROTULO_TRANSICAO.return).toBe('Registrar devolução')
    expect(rotuloEvento({ type: 'LOAN_STARTED', fromStatus: 'IN_STOCK', toStatus: 'IN_USE' })).toBe('Empréstimo iniciado')
    expect(rotuloEvento({ type: 'LOAN_RETURNED', fromStatus: 'IN_USE', toStatus: 'IN_STOCK' })).toBe('Item devolvido ao estoque')
    expect(rotuloEvento({ type: 'DISPOSAL_CANCELLED', fromStatus: 'DISPOSED', toStatus: 'IN_STOCK' })).toBe('Descarte cancelado')
  })
  it('preserva campos nulos e filtra pelo UUID do criador, nunca pelo nome', () => {
    const payload: ItemResponse = { id: 'item', barcode: 'etiqueta', displayCode: null, name: null, status: 'DRAFT', condition: null, unitId: 'unidade', model: null, createdBy: 'pessoa', createdByName: null, createdAt: '2026-10-28T14:12:00Z', updatedAt: '2026-10-28T14:12:00Z' }
    const item = mapearItem(payload)
    const usuario: Usuario = { id: 'pessoa', nome: 'Nome repetido', email: 'pessoa@example.invalid', perfil: 'funcionario', unidade: 'unidade' }
    expect(item.nome).toBe('Item sem nome')
    expect(itemVisivel(item, usuario)).toBe(true)
    expect(itemVisivel({ ...item, criadoPorId: 'outra' }, usuario)).toBe(false)
    expect(itemVisivel({ ...item, criadoPorId: null }, usuario)).toBe(false)
    expect(itemVisivel(item, { ...usuario, perfil: 'gestor' })).toBe(true)
  })
  it('troca série zerada por estado vazio e oferece tabela quando há peso', () => {
    const vazio = renderToStaticMarkup(createElement(PesoMensal, { pontos: [{ month: '2026-10', weightKg: 0 }] }))
    expect(vazio).toContain('Nenhum peso positivo registrado nos últimos 12 meses.')
    expect(vazio).not.toContain('<table')
    const preenchido = renderToStaticMarkup(createElement(PesoMensal, { pontos: [{ month: '2026-10', weightKg: 12.5 }] }))
    expect(preenchido).toContain('<title>out/26: 12,5 kg</title>')
    expect(preenchido).toContain('Ver em tabela')
    expect(preenchido).toContain('12,5')
    expect(preenchido).toContain('scope="col"')
  })
  it('interpreta o timestamp sem offset como UTC, como o timestamp com Z', () => {
    const referencia = new Date('2026-10-28T15:00:00Z')
    expect(formatarDataRelativa('2026-10-28T14:12:00', referencia)).toBe(formatarDataRelativa('2026-10-28T14:12:00Z', referencia))
  })
  it('recusa lista truncada mesmo quando totalPages diz que terminou', async () => {
    vi.stubEnv('VITE_USE_MSW', 'false')
    vi.stubEnv('VITE_INVENTORY_API_URL', 'https://inventory.example.invalid')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ content: [{ id: 'a' }], page: 0, size: 20, totalElements: 12, totalPages: 1 })))
    const { definirSessaoApi, listarPaginas } = await import('../src/services/apiReal')
    definirSessaoApi('teste', 'unidade')
    await expect(listarPaginas('inventory', '/api/v1/models')).rejects.toThrow()
  })
})
