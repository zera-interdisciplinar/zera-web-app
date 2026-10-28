import { useSessaoAuth } from '../hooks/useSessaoAuth'
import type { AuthContextProps } from '../types/componentes/AuthContext'
import { AuthContext } from './auth'

export function AuthProvider({ children }: AuthContextProps) {
  const { valor } = useSessaoAuth()

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>}
