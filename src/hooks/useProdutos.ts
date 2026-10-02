import { useCallback } from 'react'
import { listarProdutos } from '../services/produtoService'
import type { ProdutoDetalhado } from '../types/produto'
import { useRequisicao } from './useRequisicao'
import type { EstadoRequisicao } from './useRequisicao'

export function useProdutos(): EstadoRequisicao<ProdutoDetalhado[]> {
  const buscar = useCallback((sinal: AbortSignal) => listarProdutos(sinal), [])
  return useRequisicao<ProdutoDetalhado[]>(buscar)
}
