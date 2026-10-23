import { lerItemApi } from '../utils/guardaItemApi'
import { lerDescarteApi } from '../utils/guardaDescarteApi'
import { ApiError } from '../types/api'
import type { DisposalResponse } from '../types/apiReal'
import type { ProdutoDetalhado } from '../types/produto'
import type { NovoDescarte } from '../types/descarte'
import { validarNovoDescarte } from '../utils/validacaoDescarte'
import { listarPaginas, requisitarApiReal } from './apiReal'
import { contextualizar } from './http'
import { mapearItem } from './mapeadoresApi'

export async function listarItensElegiveisDescarte(sinal?: AbortSignal): Promise<ProdutoDetalhado[]> {
  try {
    const itens = await listarPaginas<unknown>('inventory', '/api/v1/items?eligibleForDisposal=true', sinal)
    return itens.map(item => mapearItem(lerItemApi(item)))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível consultar os itens disponíveis para descarte.')
  }
}

export async function registrarDescarte(entrada: NovoDescarte): Promise<DisposalResponse> {
  try {
    const validacao = validarNovoDescarte(entrada)
    if (!validacao.valido) throw new ApiError(Object.values(validacao.erros)[0] ?? 'Revise o descarte.', 422)
    return lerDescarteApi(await requisitarApiReal<unknown>('inventory', '/api/v1/disposals', {
      metodo: 'POST', corpo: validacao.dados, unidade: true,
    }))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível registrar o descarte.')
  }
}
