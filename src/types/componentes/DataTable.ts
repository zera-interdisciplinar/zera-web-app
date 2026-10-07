import type { ReactNode } from 'react'

export interface Coluna<T> {
  titulo: string
  render: (item: T) => ReactNode
  numerica?: boolean
}

export interface DataTableProps<T> {
  colunas: Coluna<T>[]
  dados: T[]
  chave: (item: T) => number | string
  legenda: string
}
