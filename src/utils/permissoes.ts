import type { Perfil } from '../types/usuario'

export interface PermissoesZera {
  ler: boolean
  cadastrarItem: boolean
  editarItem: boolean
  cadastrarModelo: boolean
  cadastrarCategoria: boolean
  excluirItem: boolean
  filtrarResponsavel: boolean
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
    filtrarResponsavel: gestor,
  }
}
