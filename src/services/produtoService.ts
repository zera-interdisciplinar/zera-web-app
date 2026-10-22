import { lerItemApi } from '../utils/guardaItemApi'
import type { ProdutoDetalhado } from '../types/produto'
import { listarPaginas, requisitarApiReal } from './apiReal'
import { contextualizar } from './contextualizar'
import type { UpdateItemRequest } from '../types/apiReal'
import { mapearItem } from './mapeadoresApi'

export async function listarProdutos(sinal?: AbortSignal): Promise<ProdutoDetalhado[]> {
  try {
    return (await listarPaginas<unknown>('inventory', '/api/v1/items', sinal)).map(item => mapearItem(lerItemApi(item)))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os itens.')
  }
}

export async function buscarProduto(id: string, sinal?: AbortSignal): Promise<ProdutoDetalhado> {
  try {
    return mapearItem(lerItemApi(await requisitarApiReal<unknown>('inventory', `/api/v1/items/${encodeURIComponent(id)}`, { sinal, unidade: true })))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar o item.')
  }
}

export async function buscarPorCodigo(codigo: string, sinal?: AbortSignal): Promise<ProdutoDetalhado> {
  try {
    return mapearItem(lerItemApi(await requisitarApiReal<unknown>('inventory', `/api/v1/items/by-barcode/${encodeURIComponent(codigo)}`, { sinal, unidade: true })))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível localizar o código de barras.')
  }
}

export async function editarItemReal(id: number | string, dados: UpdateItemRequest): Promise<ProdutoDetalhado> {
  try {
    const { notes, ...campos } = dados
    return mapearItem(lerItemApi(await requisitarApiReal<unknown>('inventory', `/api/v1/items/${encodeURIComponent(id)}`, { metodo: 'PATCH', corpo: notes ? dados : campos, unidade: true })))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível editar o item.')
  }
}
