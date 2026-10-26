import { useCallback, useEffect } from 'react'
import { listarProdutos } from '../services/produtoService'
import { observarCatalogo } from '../services/catalogoEventos'
import type { ProdutoDetalhado } from '../types/produto'
import { itemVisivel } from '../utils/escopoItens'
import { useAuth } from './useAuth'
import type { EstadoRequisicao } from './useRequisicao'
import { useRequisicao } from './useRequisicao'

export function useProdutos(): EstadoRequisicao<ProdutoDetalhado[]> {
  const { usuario } = useAuth()
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscar = useCallback(async (sinal: AbortSignal) => (await listarProdutos(sinal)).filter((item) => itemVisivel(item, usuario)), [usuario])
  const produtos = useRequisicao<ProdutoDetalhado[]>(buscar)
  useEffect(() => observarCatalogo(produtos.recarregar), [produtos.recarregar])
  return produtos
}
