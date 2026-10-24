export type Perfil = 'gestor'

export interface Usuario {
  id: number | string
  nome: string
  email: string
  perfil: Perfil
  unidade: string
  cargo?: string
}

export const ROTULO_PERFIL: Record<Perfil, string> = {
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
  /** Verdadeiro enquanto a sessão da aba é restaurada no carregamento da página. */
  restaurando: boolean
  sair: () => Promise<void>
  temPerfil: (perfis: Perfil[]) => boolean
}
