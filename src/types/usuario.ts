export type Perfil = 'funcionario' | 'gestor'

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

export const ROTULO_PERFIL: Record<Perfil, string> = {
  funcionario: 'Funcionário',
  gestor: 'Gestor',
}

export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return `${primeira}${ultima}`.toUpperCase()
}

export interface ValorAuth {
  usuario: Usuario | null
  autenticado: boolean
  entrando: boolean
  erro: string | null
  entrar: (credenciais: Credenciais) => Promise<'autenticado' | 'credenciais-invalidas' | 'falha'>
  sair: () => void
  temPerfil: (perfis: Perfil[]) => boolean
}
