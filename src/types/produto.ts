export type Classificacao = 'reutilizavel' | 'aproveitavel' | 'descartavel'
export type StatusTriagem = 'aguardando' | 'classificado' | 'descartado'
export type Condicao = 'novo' | 'usado' | 'semidanificado' | 'danificado' | 'nao-informada'

export type StatusItem =
  | 'em-aprovacao'
  | 'em-estoque'
  | 'reutilizavel'
  | 'aproveitavel'
  | 'descartavel'
  | 'lote-critico'
  | 'rascunho'
  | 'rejeitado'
  | 'em-manutencao'
  | 'aguardando-avaliacao'
  | 'descartado'
  | 'removido'

export interface Produto {
  id: number | string
  nome: string
  categoriaId: number | string
  marca: string
  condicao: Condicao
  codigoBarras: string
  responsavel: string
  dataEntrada: string
  atualizacao: string
  classificacao: Classificacao | null
  statusTriagem: StatusTriagem
}

export interface ProdutoDetalhado extends Produto {
  categoriaNome: string
  status: StatusItem
  diasEmEstoque: number
}

export interface NovoProduto {
  nome: string
  categoriaId: number | string
  marca: string
  condicao: Condicao
}

export interface FiltroItens {
  busca: string
  status: StatusItem | 'todos'
}

export const ROTULO_STATUS: Record<StatusItem, string> = {
  'em-aprovacao': 'Em aprovação',
  'em-estoque': 'Em estoque',
  reutilizavel: 'Reutilizável',
  aproveitavel: 'Aproveitável',
  descartavel: 'Descartável',
  'lote-critico': 'Lote crítico',
  rascunho: 'Rascunho',
  rejeitado: 'Rejeitado',
  'em-manutencao': 'Em manutenção',
  'aguardando-avaliacao': 'Aguardando avaliação',
  descartado: 'Descartado',
  removido: 'Removido',
}

export const ROTULO_CONDICAO: Record<Condicao, string> = {
  novo: 'Novo',
  usado: 'Usado',
  semidanificado: 'Semidanificado',
  'nao-informada': 'Não informada',
  danificado: 'Danificado',
}
