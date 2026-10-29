import type { Usuario } from '../usuario'


export interface EstadoLocalSessaoAuth {
  usuario: Usuario | null
  entrando: boolean
  erro: string | null
  expiraEm: string | null
}
