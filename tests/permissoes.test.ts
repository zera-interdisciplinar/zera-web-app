import { describe, expect, it } from 'vitest'
import { permissoesDoPerfil } from '../src/utils/permissoes'

describe('permissões de navegação e operações', () => {
  it('não concede nenhuma ação sem autenticação', () => {
    expect(Object.values(permissoesDoPerfil(null, false)).every((permitido) => !permitido)).toBe(true)
    expect(Object.values(permissoesDoPerfil(undefined, true)).every((permitido) => !permitido)).toBe(true)
  })

  it('permite funcionário real cadastrar e editar, mas não excluir ou criar categorias', () => {
    const permissao = permissoesDoPerfil('funcionario', false)
    expect(permissao.ler).toBe(true)
    expect(permissao.cadastrarItem).toBe(true)
    expect(permissao.editarItem).toBe(true)
    expect(permissao.cadastrarModelo).toBe(true)
    expect(permissao.excluirItem).toBe(false)
    expect(permissao.cadastrarCategoria).toBe(false)
    expect(permissao.gerirEstoque).toBe(false)
  })

  it('concede operações de gestão ao gestor real', () => {
    const permissao = permissoesDoPerfil('gestor', false)
    expect(permissao.cadastrarCategoria).toBe(true)
    expect(permissao.excluirItem).toBe(true)
    expect(permissao.gerirEstoque).toBe(true)
    expect(permissao.editarItem).toBe(true)
  })

  it('não interpreta administrador como MANAGER na API v1', () => {
    expect(Object.values(permissoesDoPerfil('administrador', false)).every((permitido) => !permitido)).toBe(true)
  })

  it('preserva o administrador na demonstração', () => {
    const permissao = permissoesDoPerfil('administrador', true)
    expect(permissao.consultarUsuarios).toBe(true)
    expect(permissao.consultarConfiguracoes).toBe(true)
    expect(permissao.enviarRelatorio).toBe(true)
    expect(permissao.excluirItem).toBe(true)
  })

  it('restringe exclusão ao gestor ou administrador também na demonstração', () => {
    expect(permissoesDoPerfil('funcionario', true).excluirItem).toBe(false)
    expect(permissoesDoPerfil('gestor', true).excluirItem).toBe(true)
  })

  it('não oferece páginas reais sem contrato funcional de configurações e relatórios', () => {
    expect(permissoesDoPerfil('gestor', false).consultarConfiguracoes).toBe(false)
    expect(permissoesDoPerfil('gestor', false).consultarRelatorios).toBe(false)
    expect(permissoesDoPerfil('gestor', false).enviarRelatorio).toBe(false)
  })

  it('mantém consulta de descartes disponível a ambos os papéis reais', () => {
    expect(permissoesDoPerfil('funcionario', false).consultarDescartes).toBe(true)
    expect(permissoesDoPerfil('gestor', false).consultarDescartes).toBe(true)
  })

  it('restringe gestão de usuários real enquanto não há contrato de leitura para funcionário', () => {
    expect(permissoesDoPerfil('funcionario', false).consultarUsuarios).toBe(false)
    expect(permissoesDoPerfil('gestor', false).consultarUsuarios).toBe(true)
  })
})
