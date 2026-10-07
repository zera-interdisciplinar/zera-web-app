import { describe, expect, it } from 'vitest'
import { validarCategoria, validarCodigoEtiqueta, validarEdicaoItem } from '../src/utils/validacaoInventario'

describe('validação do inventário', () => {
  it('normaliza o código da etiqueta antes da busca', () => {
    const resultado = validarCodigoEtiqueta({ codigo: '  ZERA-001  ' })
    expect(resultado.valido).toBe(true)
    expect(resultado.dados.codigo).toBe('ZERA-001')
  })

  it('bloqueia etiquetas vazias ou acima do tamanho permitido', () => {
    expect(validarCodigoEtiqueta({ codigo: ' ' }).erros.codigo).toBeTruthy()
    expect(validarCodigoEtiqueta({ codigo: 'a'.repeat(121) }).erros.codigo).toBeTruthy()
  })

  it('exige nome e descrição da categoria com erros por campo', () => {
    const resultado = validarCategoria({ nome: ' ', descricao: '', diasLimiteDescarte: 90, exigeChecklistPericulosidade: false })
    expect(resultado.valido).toBe(false)
    expect(resultado.erros.nome).toBeTruthy()
    expect(resultado.erros.descricao).toBeTruthy()
  })

  it('rejeita categoria acima dos limites sem truncar silenciosamente', () => {
    const resultado = validarCategoria({ nome: 'a'.repeat(81), descricao: 'a'.repeat(256), diasLimiteDescarte: 90, exigeChecklistPericulosidade: false })
    expect(resultado.valido).toBe(false)
    expect(resultado.erros.nome).toBeTruthy()
    expect(resultado.erros.descricao).toBeTruthy()
  })

  it('normaliza os textos antes do cadastro da categoria', () => {
    const resultado = validarCategoria({ nome: '  Eletrônicos  ', descricao: '  Equipamentos em uso  ', diasLimiteDescarte: 90, exigeChecklistPericulosidade: false })
    expect(resultado.valido).toBe(true)
    expect(resultado.dados.nome).toBe('Eletrônicos')
    expect(resultado.dados.descricao).toBe('Equipamentos em uso')
  })

  it('permite editar um item sem substituir observações existentes', () => {
    const resultado = validarEdicaoItem({ name: ' Notebook ', condition: 'USED', notes: '' })
    expect(resultado.valido).toBe(true)
    expect(resultado.dados).toEqual({ name: 'Notebook', condition: 'USED', notes: '' })
  })

  it('rejeita nome vazio e observações acima do limite', () => {
    const resultado = validarEdicaoItem({ name: ' ', condition: 'USED', notes: 'a'.repeat(501) })
    expect(resultado.valido).toBe(false)
    expect(resultado.erros.name).toBeTruthy()
    expect(resultado.erros.notes).toBeTruthy()
  })
})
