import { useCallback, useEffect } from 'react'
import { observarCatalogo } from '../services/catalogoEventos'
import { listarCategorias } from '../services/categoriaService'
import type { Categoria } from '../types/categoria'
import { useRequisicao } from './useRequisicao'
import type { EstadoRequisicao } from './useRequisicao'

export function useCategorias(): EstadoRequisicao<Categoria[]> {
  const buscar = useCallback((sinal: AbortSignal) => listarCategorias(sinal), [])
  const resultado = useRequisicao<Categoria[]>(buscar)
  useEffect(() => observarCatalogo(resultado.recarregar), [resultado.recarregar])
  return resultado
}
