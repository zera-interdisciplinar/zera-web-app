import type { ReactNode } from 'react'
import type { Perfil } from '../usuario'
import type { PermissaoZera } from '../../utils/permissoes'

export interface PrivateRouteProps {
  children: ReactNode
  perfis?: Perfil[]
  permissao?: PermissaoZera
}
