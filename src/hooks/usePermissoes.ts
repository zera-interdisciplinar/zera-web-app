import { useAuth } from './useAuth'
import { permissoesDoPerfil } from '../utils/permissoes'
import type { PermissoesZera } from '../utils/permissoes'
import { modoDemonstracao } from '../services/apiReal'

export function usePermissoes(): PermissoesZera {
  const { usuario } = useAuth()
  return permissoesDoPerfil(usuario?.perfil, modoDemonstracao)
}
