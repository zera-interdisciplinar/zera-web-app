import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.doUnmock('virtual:credencial-demo')
  vi.resetModules()
})

describe('validação demo com valores efêmeros, sem credencial da fixture local', () => {
  it('recusa administrador quando não há fixture', async () => {
    vi.doMock('virtual:credencial-demo', () => ({ default: '' }))
    const { validarCredencialDemo } = await import('../src/services/demoService')
    expect(await validarCredencialDemo(crypto.randomUUID())).toBe(false)
  })

  it('não aceita outra entrada com o mesmo comprimento', async () => {
    const entrada = crypto.randomUUID()
    const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(entrada))
    const digest = Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
    vi.doMock('virtual:credencial-demo', () => ({ default: digest }))
    const { validarCredencialDemo } = await import('../src/services/demoService')
    expect(await validarCredencialDemo(crypto.randomUUID())).toBe(false)
    expect(await validarCredencialDemo(entrada)).toBe(true)
  })
})
