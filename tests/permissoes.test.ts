import { describe, expect, it } from 'vitest'
import { permissoesDoPerfil } from '../src/utils/permissoes'

describe('permissões de navegação e operações', () => {
  it('não concede nenhuma ação sem autenticação', () => {
    expect(Object.values(permissoesDoPerfil(null)).every((permitido) => !permitido)).toBe(true)
    expect(Object.values(permissoesDoPerfil(undefined)).every((permitido) => !permitido)).toBe(true)
  })

  it('permite funcionário cadastrar e editar, mas não excluir ou criar categorias', () => {
    const permissao = permissoesDoPerfil('funcionario')
    expect(permissao.ler).toBe(true)
    expect(permissao.cadastrarItem).toBe(true)
    expect(permissao.editarItem).toBe(true)
    expect(permissao.cadastrarModelo).toBe(true)
    expect(permissao.excluirItem).toBe(false)
    expect(permissao.cadastrarCategoria).toBe(false)
  })

  it('concede operações de gestão ao gestor', () => {
    const permissao = permissoesDoPerfil('gestor')
    expect(permissao.cadastrarCategoria).toBe(true)
    expect(permissao.excluirItem).toBe(true)
    expect(permissao.editarItem).toBe(true)
  })

  it('não reconhece perfis fora do contrato v1 (por exemplo, administrador)', () => {
    expect(Object.values(permissoesDoPerfil('administrador' as never)).every((permitido) => !permitido)).toBe(true)
  })
})
