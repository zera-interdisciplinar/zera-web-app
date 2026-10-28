import type { ProdutoDetalhado } from '../produto'

export interface EdicaoItemRealProps {
  item: ProdutoDetalhado
  aoConcluir: () => void
}
