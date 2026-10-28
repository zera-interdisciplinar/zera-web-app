import { useCallback } from 'react'
import { listarProdutos } from '../services/produtoService'
import type { ProdutoDetalhado } from '../types/produto'
import { useRequisicao } from './useRequisicao'
import type { EstadoRequisicao } from './useRequisicao'
import { useAuth } from './useAuth'
import { itemVisivel } from '../utils/escopoItens'

export function useProdutos(): EstadoRequisicao<ProdutoDetalhado[]> {
  const { usuario } = useAuth()
  const buscar = useCallback(async (sinal: AbortSignal) => (await listarProdutos(sinal)).filter((item) => itemVisivel(item, usuario)), [usuario])
  return useRequisicao<ProdutoDetalhado[]>(buscar)
}
