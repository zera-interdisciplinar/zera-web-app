import type { ErrosDeCampo } from '../../utils/validacao'
import type { Credenciais } from '../usuario'

export interface EstadoBloqueio {
  falhas: number
  bloqueadoAte: number
  restante: number
}

export interface EstadoLocalLogin {
  formulario: Credenciais
  erros: ErrosDeCampo<Credenciais>
  mostrarErro: boolean
  bloqueio: EstadoBloqueio
}
