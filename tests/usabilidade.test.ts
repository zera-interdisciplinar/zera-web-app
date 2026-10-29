import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatarDataRelativa } from '../src/utils/formatacao'
import { normalizarBusca } from '../src/utils/busca'
import { LIMITES, limitarNumero } from '../src/utils/limitesNumericos'

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
  it('interpreta o timestamp sem offset como UTC, como o timestamp com Z', () => {
    const referencia = new Date('2026-10-28T15:00:00Z')
    expect(formatarDataRelativa('2026-10-28T14:12:00', referencia)).toBe(formatarDataRelativa('2026-10-28T14:12:00Z', referencia))
  })
})
