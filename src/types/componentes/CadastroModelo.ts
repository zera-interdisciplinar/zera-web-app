import type { EstadoRequisicao } from '../../hooks/useRequisicao';
import type { Categoria } from '../categoria';
import type { RetornoCadastroModelo } from '../formularioModelo';

export interface CadastroModeloProps { cadastro: RetornoCadastroModelo; categorias: EstadoRequisicao<Categoria[]> }
