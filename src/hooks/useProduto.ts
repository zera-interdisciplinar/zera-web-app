import { useCallback } from 'react'
import { buscarProduto } from '../services/produtoService'
import type { ProdutoDetalhado } from '../types/produto'
import { useRequisicao } from './useRequisicao'
import type { EstadoRequisicao } from './useRequisicao'
import { useAuth } from './useAuth'
import { itemVisivel } from '../utils/escopoItens'

export function useProduto(id: number | string | null): EstadoRequisicao<ProdutoDetalhado> {
  const { usuario } = useAuth()
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
