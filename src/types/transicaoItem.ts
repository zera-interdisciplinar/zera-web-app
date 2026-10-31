import type { ProdutoDetalhado } from './produto'
import type { CondicaoItemReal } from './cadastroItem'

export type AcaoItemReal = 'submit' | 'approve' | 'reject' | 'lend' | 'return' | 'maintenance/start' | 'maintenance/finish' | 'evaluate'

export interface DadosTransicaoItem {
  reason: string
  condition: CondicaoItemReal
}

export interface FluxoItemRealProps {
  item: ProdutoDetalhado
  aoConcluir: () => void
}

export const ROTULO_TRANSICAO: Record<AcaoItemReal, string> = {
  submit: 'Enviar cadastro',
  approve: 'Aprovar item',
  reject: 'Reprovar item',
  lend: 'Registrar empréstimo',
  return: 'Registrar devolução',
  'maintenance/start': 'Iniciar manutenção',
  'maintenance/finish': 'Concluir manutenção',
  evaluate: 'Avaliar condição',
}
