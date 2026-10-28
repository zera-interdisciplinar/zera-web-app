import { useCallback } from 'react'
import { listarDescartes } from '../services/cicloService'
import { modoDemonstracao } from '../services/apiReal'
import { useRequisicao } from './useRequisicao'
import type { EstadoRequisicao } from './useRequisicao'
import type { DisposalResponse } from '../types/apiReal'

export function useDescartes(): EstadoRequisicao<DisposalResponse[]> {
  const buscar = useCallback((sinal: AbortSignal) => listarDescartes(sinal), [])
  return useRequisicao(buscar, !modoDemonstracao)
}
