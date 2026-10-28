import type { Perfil } from '../types/usuario'

export interface PermissoesZera {
  ler: boolean
  cadastrarItem: boolean
  editarItem: boolean
  cadastrarModelo: boolean
  cadastrarCategoria: boolean
  excluirItem: boolean
  gerirEstoque: boolean
  consultarUsuarios: boolean
  consultarRelatorios: boolean
  consultarDescartes: boolean
  consultarConfiguracoes: boolean
  filtrarResponsavel: boolean
  realizarTriagem: boolean
  enviarRelatorio: boolean
}

export type PermissaoZera = keyof PermissoesZera

export function permissoesDoPerfil(perfil: Perfil | null | undefined, demonstracao = false): PermissoesZera {
  const autenticado = perfil === 'funcionario' || perfil === 'gestor' || (demonstracao && perfil === 'administrador')
  const gestor = perfil === 'gestor' || (demonstracao && perfil === 'administrador')
  return {
    ler: autenticado,
    cadastrarItem: autenticado,
    editarItem: autenticado,
    cadastrarModelo: autenticado,
    cadastrarCategoria: gestor,
    excluirItem: gestor,
    gerirEstoque: gestor,
    consultarUsuarios: gestor,
    consultarRelatorios: demonstracao && gestor,
    consultarDescartes: autenticado,
    consultarConfiguracoes: demonstracao && gestor,
    filtrarResponsavel: gestor,
    realizarTriagem: demonstracao && autenticado,
    enviarRelatorio: demonstracao && gestor,
  }
}
