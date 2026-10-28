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

export function permissoesDoPerfil(perfil: Perfil | null | undefined): PermissoesZera {
  const autenticado = perfil === 'funcionario' || perfil === 'gestor'
  const gestor = perfil === 'gestor'
  return {
    ler: autenticado,
    cadastrarItem: autenticado,
    editarItem: autenticado,
    cadastrarModelo: autenticado,
    cadastrarCategoria: gestor,
    excluirItem: gestor,
    gerirEstoque: gestor,
    consultarUsuarios: gestor,
    consultarRelatorios: false,
    consultarDescartes: autenticado,
    consultarConfiguracoes: false,
    filtrarResponsavel: gestor,
    realizarTriagem: false,
    enviarRelatorio: false,
  }
}
