import { useCallback } from 'react'
import { listarCategorias } from '../services/categoriaService'
import type { Categoria } from '../types/categoria'
import { useRequisicao } from './useRequisicao'
import type { EstadoRequisicao } from './useRequisicao'

export function useCategorias(): EstadoRequisicao<Categoria[]> {
  const buscar = useCallback((sinal: AbortSignal) => listarCategorias(sinal), [])
  return useRequisicao<Categoria[]>(buscar)
}
