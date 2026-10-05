import type { AcaoItemReal, DadosTransicaoItem } from '../types/transicaoItem'
import type { ResultadoValidacao, ErrosDeCampo } from './validacao'
import type { StatusItem } from '../types/produto'
import type { Perfil } from '../types/usuario'
import { sanitizarTexto } from './sanitizacao'

export function acoesDisponiveisItem(status: StatusItem, perfil: Perfil | undefined): AcaoItemReal[] {
  if (perfil !== 'gestor' && perfil !== 'funcionario') return []
  if (status === 'rascunho' || status === 'rejeitado') return ['submit']
  if (status === 'em-aprovacao' && perfil === 'gestor') return ['approve', 'reject']
  if (status === 'em-estoque') return ['maintenance/start']
  if (status === 'em-manutencao') return ['maintenance/finish']
  if (status === 'aguardando-avaliacao') return ['evaluate']
  return []
}

export function validarTransicaoItem(acao: AcaoItemReal, entrada: DadosTransicaoItem): ResultadoValidacao<DadosTransicaoItem> {
  const dados: DadosTransicaoItem = { reason: sanitizarTexto(entrada.reason), condition: entrada.condition }
  const erros: ErrosDeCampo<DadosTransicaoItem> = {}
  if (acao === 'reject' || acao === 'maintenance/start') {
    if (!dados.reason) erros.reason = 'Informe o motivo.'
    else if (dados.reason.length > 500) erros.reason = 'O motivo pode ter até 500 caracteres.'
  }
  if (acao === 'evaluate' && !['NEW', 'USED', 'SEMI_DAMAGED', 'DAMAGED'].includes(dados.condition)) {
    erros.condition = 'Selecione a condição após a manutenção.'
  }
  return { valido: Object.keys(erros).length === 0, erros, dados }
}
