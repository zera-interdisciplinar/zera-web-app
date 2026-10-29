import { createContext } from 'react'
import type { ValorAuth } from '../types/usuario'
export type { ValorAuth } from '../types/usuario'

export const AuthContext = createContext<ValorAuth | null>(null)
