import { useContext } from 'react'
import { AuthContext } from '../context/auth'
import type { ValorAuth } from '../context/auth'

export function useAuth(): ValorAuth {
  const valor = useContext(AuthContext)
  if (valor === null) {
    throw new Error('useAuth precisa estar dentro de <AuthProvider>.')
  }
  return valor
}
