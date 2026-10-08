import { useCallback } from 'react'
import { modoDemonstracao } from '../services/apiReal'
import { listarDescartes } from '../services/cicloService'
import type { DisposalResponse } from '../types/apiReal'
import type { EstadoRequisicao } from './useRequisicao'
import { useRequisicao } from './useRequisicao'

export function useDescartes(): EstadoRequisicao<DisposalResponse[]> {
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscar = useCallback((sinal: AbortSignal) => listarDescartes(sinal), [])
  return useRequisicao(buscar, !modoDemonstracao)
}
