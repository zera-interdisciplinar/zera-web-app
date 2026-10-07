import { ApiError } from '../types/api'
import type { ItemResponse } from '../types/apiReal'
import type { ProdutoDetalhado } from '../types/produto'
import type { AcaoItemReal, DadosTransicaoItem } from '../types/transicaoItem'
import { validarTransicaoItem } from '../utils/validacaoTransicaoItem'
import { requisitarApiReal } from './apiReal'
import { contextualizar } from './http'
import { mapearItem } from './mapeadoresApi'

const ACOES: AcaoItemReal[] = ['submit', 'approve', 'reject', 'maintenance/start', 'maintenance/finish', 'evaluate']

export async function transicionarItemReal(id: number | string, acao: AcaoItemReal, entrada: DadosTransicaoItem, sinal?: AbortSignal): Promise<ProdutoDetalhado> {
  try {
    if (!ACOES.includes(acao)) throw new ApiError('Operação inválida.', 422)
    const resultado = validarTransicaoItem(acao, entrada)
    if (!resultado.valido) {
      const campo = Object.keys(resultado.erros)[0] as keyof DadosTransicaoItem
      throw new ApiError(resultado.erros[campo] ?? 'Revise os dados.', 422, campo)
    }
    const corpo = acao === 'reject' || acao === 'maintenance/start'
      ? { reason: resultado.dados.reason }
      : acao === 'evaluate' ? { condition: resultado.dados.condition } : undefined
    return mapearItem(await requisitarApiReal<ItemResponse>('inventory', `/api/v1/items/${encodeURIComponent(id)}/${acao}`, {
      metodo: 'POST', corpo, unidade: true, sinal,
    }))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível atualizar o estado do item.')
  }
}
