import type { Classificacao, NovoProduto, ProdutoDetalhado } from '../types/produto'
import { contextualizar, requisitar } from './http'
import { listarPaginas, modoDemonstracao, requisitarApiReal } from './apiReal'
import type { ItemResponse, UpdateItemRequest } from '../types/apiReal'
import { mapearItem } from './mapeadoresApi'

export async function listarProdutos(sinal?: AbortSignal): Promise<ProdutoDetalhado[]> {
  try {
    if (!modoDemonstracao) return (await listarPaginas<ItemResponse>('inventory', '/api/v1/items', sinal)).map(mapearItem)
    return await requisitar<ProdutoDetalhado[]>('/items', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os itens.')
  }
}

export async function buscarProduto(id: number | string, sinal?: AbortSignal): Promise<ProdutoDetalhado> {
  try {
    if (!modoDemonstracao) return mapearItem(await requisitarApiReal<ItemResponse>('inventory', `/api/v1/items/${encodeURIComponent(id)}`, { sinal, unidade: true }))
    return await requisitar<ProdutoDetalhado>(`/items/${id}`, { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar o item.')
  }
}

export async function buscarPorCodigo(codigo: string, sinal?: AbortSignal): Promise<ProdutoDetalhado> {
  try {
    if (modoDemonstracao) {
      const produto = (await listarProdutos(sinal)).find((item) => item.codigoBarras === codigo)
      if (!produto) throw new Error('Código não encontrado no inventário.')
      return produto
    }
    return mapearItem(await requisitarApiReal<ItemResponse>('inventory', `/api/v1/items/by-barcode/${encodeURIComponent(codigo)}`, { sinal, unidade: true }))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível localizar o código de barras.')
  }
}

export async function editarItemReal(id: number | string, dados: UpdateItemRequest): Promise<ProdutoDetalhado> {
  try {
    const { notes, ...campos } = dados
    return mapearItem(await requisitarApiReal<ItemResponse>('inventory', `/api/v1/items/${encodeURIComponent(id)}`, { metodo: 'PATCH', corpo: notes ? dados : campos, unidade: true }))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível editar o item.')
  }
}

export async function criarProduto(novo: NovoProduto): Promise<ProdutoDetalhado> {
  try {
    if (!modoDemonstracao) throw new Error('Informe o modelo e o código de barras para cadastrar este item.')
    return await requisitar<ProdutoDetalhado>('/items', { metodo: 'POST', corpo: novo })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível cadastrar o item.')
  }
}

export async function atualizarProduto(id: number | string, dados: NovoProduto): Promise<ProdutoDetalhado> {
  try {
    if (!modoDemonstracao) throw new Error('Abra os detalhes do item para editar suas informações.')
    return await requisitar<ProdutoDetalhado>(`/items/${id}`, { metodo: 'PUT', corpo: dados })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível salvar as alterações do item.')
  }
}

export async function excluirProduto(id: number | string): Promise<void> {
  try {
    if (!modoDemonstracao) throw new Error('Não foi possível remover este item. Abra o inventário e tente novamente.')
    return await requisitar<void>(`/items/${id}`, { metodo: 'DELETE' })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível excluir o item.')
  }
}

export interface ResultadoTriagem {
  produtoId: number | string
  classificacao: Classificacao
  checklistPericulosidade: string[]
  responsavel: string
}

export async function registrarTriagem(resultado: ResultadoTriagem): Promise<ProdutoDetalhado> {
  try {
    if (!modoDemonstracao) throw new Error('Abra os detalhes do item para iniciar sua avaliação.')
    return await requisitar<ProdutoDetalhado>(`/items/${resultado.produtoId}/triage`, {
      metodo: 'POST',
      corpo: resultado,
    })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível registrar a triagem.')
  }
}
