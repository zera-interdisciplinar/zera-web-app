import { describe, expect, it } from 'vitest'
import { validarEmailRecuperacao } from '../src/utils/validacao'

describe('recuperação de senha', () => {
  it('aceita somente formato válido no domínio @zera.com', () => {
    expect(validarEmailRecuperacao('pessoa@zera.com')).toMatchObject({ valido: true, email: 'pessoa@zera.com' })
    expect(validarEmailRecuperacao('Pessoa@ZERA.COM')).toMatchObject({ valido: true, email: 'pessoa@zera.com' })
    expect(validarEmailRecuperacao('invalido')).toMatchObject({ valido: false, erro: 'Informe um e-mail válido.' })
    expect(validarEmailRecuperacao('pessoa@qa.example')).toMatchObject({ valido: false, erro: 'Use um e-mail @zera.com.' })
  })
})
