import type { Condicao } from './produto'

export type StatusRelatorio = 'enviado'

export interface Recicladora {
  id: number | string
  nome: string
  cnpj: string
  cidade: string
  email?: string
}

export interface NovaRecicladora {
  nome: string
  cnpj: string
  cidade: string
  email?: string
}

export interface ItemRelatorio {
  produtoId: number | string
  descricao: string
  categoriaNome: string
  fabricante: string
  modelo: string
  condicao: Condicao
  diasEmEstoque: number
}

export interface Relatorio {
  id: number | string
  criadoEm: string
  periodo: string
  status: StatusRelatorio
  recicladoraNome: string
  totalItens: number
}

export interface PreviaRelatorio {
  itens: ItemRelatorio[]
  totalItens: number
}
