import type { EstadoExclusaoItem, EstadoFormularioItem } from '../formularioItem'
import type { ProdutoDetalhado } from '../produto'


export interface EstadoLocalCadastroItens {
  criado: ProdutoDetalhado | null
  estado: EstadoFormularioItem
  exclusao: EstadoExclusaoItem
}
