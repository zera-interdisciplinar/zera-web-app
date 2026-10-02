export interface Modelo {
  id: number | string
  categoriaId: number | string
  categoriaNome?: string
  fabricante: string
  nome: string
  especificacoes: Record<string, string>
  vidaUtilMeses: number | null
  materiais?: string[]
}

export interface NovoModelo {
  categoriaId: number | string
  fabricante: string
  nome: string
  especificacoes: Record<string, string>
  vidaUtilMeses: number
}
