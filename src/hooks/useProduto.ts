import { useCallback } from 'react'
import { buscarProduto } from '../services/produtoService'
import type { ProdutoDetalhado } from '../types/produto'
import type { EstadoRequisicao } from './useRequisicao'
import { useRequisicao } from './useRequisicao'

export function useProduto(id: string | null): EstadoRequisicao<ProdutoDetalhado> {
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscar = useCallback(
    (sinal: AbortSignal) => {
      if (id === null) throw new Error('Identificador ausente.')
      return buscarProduto(id, sinal)
    },
    [id],
  )
  return useRequisicao<ProdutoDetalhado>(buscar, id !== null)
}
