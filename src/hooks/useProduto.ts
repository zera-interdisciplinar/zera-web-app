import { useCallback } from 'react'
import { buscarProduto } from '../services/produtoService'
import type { ProdutoDetalhado } from '../types/produto'
import { itemVisivel } from '../utils/escopoItens'
import { useAuth } from './useAuth'
import type { EstadoRequisicao } from './useRequisicao'
import { useRequisicao } from './useRequisicao'

export function useProduto(id: number | string | null): EstadoRequisicao<ProdutoDetalhado> {
  const { usuario } = useAuth()
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscar = useCallback(
    async (sinal: AbortSignal) => {
      if (id === null) throw new Error('Identificador ausente.')
      const item = await buscarProduto(id, sinal)
      if (!itemVisivel(item, usuario)) throw new Error('Este item não está disponível para sua conta.')
      return item
    },
    [id, usuario],
  )
  return useRequisicao<ProdutoDetalhado>(buscar, id !== null)
}
