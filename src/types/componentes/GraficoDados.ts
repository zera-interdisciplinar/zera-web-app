import type { PontoBarra } from './BarChart'

export interface GraficoDadosProps {
  titulo: string
  pontos: PontoBarra[]
  unidade: string
  eixo: string
  vazio: string
  semDados?: string
  demo?: boolean
}
