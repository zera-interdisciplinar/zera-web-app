import { useCallback, useEffect } from 'react'
import { observarCatalogo } from '../services/catalogoEventos'
import { listarCategorias } from '../services/categoriaService'
import type { Categoria } from '../types/categoria'
import type { EstadoRequisicao } from './useRequisicao'
import { useRequisicao } from './useRequisicao'

export function useCategorias(): EstadoRequisicao<Categoria[]> {
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscar = useCallback((sinal: AbortSignal) => listarCategorias(sinal), [])
  const resultado = useRequisicao<Categoria[]>(buscar)
  useEffect(() => observarCatalogo(resultado.recarregar), [resultado.recarregar])
  return resultado
}
