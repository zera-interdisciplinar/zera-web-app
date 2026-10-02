export interface Categoria {
  id: number | string
  codigo: string
  nome: string
  descricao: string
  diasLimiteDescarte?: number
  exigeChecklistPericulosidade?: boolean
}

export interface NovaCategoria {
  nome: string
  descricao: string
  diasLimiteDescarte: number
  exigeChecklistPericulosidade: boolean
}
