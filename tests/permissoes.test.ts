import { describe, expect, it } from 'vitest'
import { permissoesDoPerfil } from '../src/utils/permissoes'

describe('permissões de navegação e operações', () => {
  it('não concede nenhuma ação sem autenticação', () => {
    expect(Object.values(permissoesDoPerfil(null)).every((permitido) => !permitido)).toBe(true)
    expect(Object.values(permissoesDoPerfil(undefined)).every((permitido) => !permitido)).toBe(true)
  })

  it('concede operações de gestão ao gestor', () => {
    const permissao = permissoesDoPerfil('gestor')
    expect(permissao.cadastrarCategoria).toBe(true)
    expect(permissao.excluirItem).toBe(true)
    expect(permissao.editarItem).toBe(true)
    expect(permissao.cadastrarItem).toBe(false)
  })

  it.each(['funcionario', 'administrador'])('não reconhece o perfil %s na web (só o gestor entra)', (perfil) => {
    expect(Object.values(permissoesDoPerfil(perfil as never)).every((permitido) => !permitido)).toBe(true)
  })
})
