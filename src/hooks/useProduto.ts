import { useCallback } from 'react'
import { buscarProduto } from '../services/produtoService'
import { buscarNomeUsuario } from '../services/usuarioService'
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
      let item = await buscarProduto(id, sinal)
      if (!itemVisivel(item, usuario)) throw new Error('Este item não está disponível para sua conta.')
      if (usuario?.perfil === 'gestor' && item.responsavel === 'Não informado' && item.criadoPorId) {
        const nome = await buscarNomeUsuario(item.criadoPorId)
        if (nome) item = { ...item, responsavel: nome }
      }
      return item
    },
    [id, usuario],
  )
  return useRequisicao<ProdutoDetalhado>(buscar, id !== null)
}
