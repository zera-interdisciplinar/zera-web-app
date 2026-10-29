import type { ErrosDeCampo } from '../../utils/validacao'
import type { NovaRecicladora } from '../relatorio'


export interface EstadoLocalCadastroRecicladoras {
  busca: string
  modalAberto: boolean
  form: NovaRecicladora
  erros: ErrosDeCampo<NovaRecicladora>
  enviando: boolean
  erroEnvio: string | null
}
