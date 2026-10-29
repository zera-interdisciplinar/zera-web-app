import type { TipoManutencao } from '../manutencao'

export interface FormManutencao {
  tipo: TipoManutencao
  descricao: string
  tecnico: string
}

export interface EstadoLocalDetalheItem {
  abaAtiva: string
  form: FormManutencao
  erroForm: string | null
  enviando: boolean
  sucesso: string | null
}
