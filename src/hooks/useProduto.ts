import { useCallback } from 'react'
import { buscarProduto } from '../services/produtoService'
import type { ProdutoDetalhado } from '../types/produto'
import { useRequisicao } from './useRequisicao'
import type { EstadoRequisicao } from './useRequisicao'

export function useProduto(id: number | string | null): EstadoRequisicao<ProdutoDetalhado> {
  const buscar = useCallback(
    (sinal: AbortSignal) => id === null ? Promise.reject(new Error('Identificador ausente.')) : buscarProduto(id, sinal),
    [id],
  )
  return useRequisicao<ProdutoDetalhado>(buscar, id !== null)
}
