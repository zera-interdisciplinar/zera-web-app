import { useCallback } from 'react'
import { listarProdutos } from '../services/produtoService'
import type { ProdutoDetalhado } from '../types/produto'
import { itemVisivel } from '../utils/escopoItens'
import { useAuth } from './useAuth'
import type { EstadoRequisicao } from './useRequisicao'
import { useRequisicao } from './useRequisicao'

export function useProdutos(): EstadoRequisicao<ProdutoDetalhado[]> {
  const { usuario } = useAuth()
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscar = useCallback(async (sinal: AbortSignal) => (await listarProdutos(sinal)).filter((item) => itemVisivel(item, usuario)), [usuario])
  return useRequisicao<ProdutoDetalhado[]>(buscar)
}
