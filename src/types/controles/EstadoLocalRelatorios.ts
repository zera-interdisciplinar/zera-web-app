
export type EtapaModal = 'previa' | 'confirmacao'

export interface EstadoLocalRelatorios {
  modalAberto: boolean
  etapa: EtapaModal
  recicladoraId: string
  erroRecicladora: string | null
  enviando: boolean
  erroEnvio: string | null
}
