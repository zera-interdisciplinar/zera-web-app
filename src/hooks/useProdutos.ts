import { useCallback } from 'react'
import { listarProdutos } from '../services/produtoService'
import type { ProdutoDetalhado } from '../types/produto'
import type { EstadoRequisicao } from './useRequisicao'
import { useRequisicao } from './useRequisicao'

export function useProdutos(): EstadoRequisicao<ProdutoDetalhado[]> {
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscar = useCallback((sinal: AbortSignal) => listarProdutos(sinal), [])
  return useRequisicao<ProdutoDetalhado[]>(buscar)
}
