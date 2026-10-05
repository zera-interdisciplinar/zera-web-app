

export interface PontoBarra {
  rotulo: string
  valor: number
  destaque?: boolean
}

export interface BarChartProps {
  pontos: PontoBarra[]
  maximoEixo: number
  descricao: string
  rotuloValor?: string
}
