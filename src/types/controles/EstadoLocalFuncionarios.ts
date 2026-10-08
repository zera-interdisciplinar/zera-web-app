import type { ErrosDeCampo } from '../../utils/validacao'
import type { NovoUsuario } from '../usuario'

export interface FormFuncionario {
  nome: string
  email: string
  perfil: string
  unidade: string
}

export interface EstadoLocalFuncionarios {
  busca: string
  modalAberto: boolean
  form: FormFuncionario
  erros: ErrosDeCampo<NovoUsuario>
  enviando: boolean
  erroEnvio: string | null
}
