

export interface PontoBarra {
  id?: string
  rotulo: string
  valor: number
  destaque?: boolean
}

export interface BarChartProps {
  pontos: PontoBarra[]
  maximoEixo: number
  descricao: string
  rotuloValor?: string
  rotuloEixo?: string
}
