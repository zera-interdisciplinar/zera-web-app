export type SimulacaoCores = 'nenhuma' | 'protanopia' | 'deuteranopia' | 'tritanopia'

export interface PreferenciasAcessibilidade {
  tamanhoTexto: number
  contrasteAlto: boolean
  espacamento: boolean
  modoFoco: boolean
  fonteLegivel: boolean
  guiaLeitura: boolean
  simulacaoCores: SimulacaoCores
}

export interface PropriedadesBarraAcessibilidade {
  preferencias: PreferenciasAcessibilidade
  aoAlterar: (alteracoes: Partial<PreferenciasAcessibilidade>) => void
}
