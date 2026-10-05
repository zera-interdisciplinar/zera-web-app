import { createContext } from 'react'
import type { Credenciais, Perfil, Usuario } from '../types/usuario'

export interface ValorAuth {
  usuario: Usuario | null
  autenticado: boolean
  entrando: boolean
  erro: string | null
  entrar: (credenciais: Credenciais) => Promise<boolean>
  sair: () => void
  temPerfil: (perfis: Perfil[]) => boolean
}

export const AuthContext = createContext<ValorAuth | null>(null)
