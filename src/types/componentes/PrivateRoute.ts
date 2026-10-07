import type { ReactNode } from 'react'
import type { Perfil } from '../usuario'

export interface PrivateRouteProps {
  children: ReactNode
  perfis?: Perfil[]
}
