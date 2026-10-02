export type Perfil = 'funcionario' | 'gestor' | 'administrador'

export interface Usuario {
  id: number | string
  nome: string
  email: string
  perfil: Perfil
  unidade: string
  cargo?: string
}

export interface Credenciais {
  email: string
  senha: string
}

export interface SessaoAutenticada {
  usuario: Usuario
  expiraEm: string
}

export interface NovoUsuario {
  nome: string
  email: string
  perfil: Perfil
  unidade: string
}

export const ROTULO_PERFIL: Record<Perfil, string> = {
  funcionario: 'Funcionário',
  gestor: 'Gestor',
  administrador: 'Administrador',
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return `${primeira}${ultima}`.toUpperCase()
}
