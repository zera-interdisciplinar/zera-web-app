import { describe, expect, it } from 'vitest'
import { validarEmailRecuperacao } from '../src/utils/validacao'
import { dashboardDemoEnabled } from './mocks/dashboardMode'

describe('recuperação de senha', () => {
  it('aceita somente formato válido no domínio @zera.com', () => {
    expect(validarEmailRecuperacao('pessoa@zera.com')).toMatchObject({ valido: true, email: 'pessoa@zera.com' })
    expect(validarEmailRecuperacao('Pessoa@ZERA.COM')).toMatchObject({ valido: true, email: 'pessoa@zera.com' })
    expect(validarEmailRecuperacao('invalido')).toMatchObject({ valido: false, erro: 'Informe um e-mail válido.' })
    expect(validarEmailRecuperacao('pessoa@qa.example')).toMatchObject({ valido: false, erro: 'Use um e-mail @zera.com.' })
  })
})

describe('modo de fixtures do dashboard', () => {
  it('exige MSW e respeita a desativação explícita do dashboard', () => {
    expect(dashboardDemoEnabled('true', 'true')).toBe(true)
    expect(dashboardDemoEnabled('false', 'true')).toBe(false)
    expect(dashboardDemoEnabled('true', 'false')).toBe(false)
  })
})
