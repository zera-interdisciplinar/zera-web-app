import type { ProdutoDetalhado } from '../types/produto'
import type { Usuario } from '../types/usuario'

export function itemVisivel(item: ProdutoDetalhado, usuario: Usuario | null): boolean {
  if (!usuario) return false
  return usuario.perfil !== 'funcionario' || (item.criadoPorId != null && String(item.criadoPorId) === String(usuario.id))
}
