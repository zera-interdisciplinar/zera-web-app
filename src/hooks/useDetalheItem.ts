import { useCallback, useEffect, useRef, useState } from 'react'
import { listarEventos } from '../services/cicloService'
import type { EventResponse } from '../types/apiReal'
import { useAuth } from './useAuth'
import { useProduto } from './useProduto'
import { useRequisicao } from './useRequisicao'

export function useDetalheItem({ produtoId }: { produtoId: string }) {
  const { temPerfil } = useAuth()
  const produto = useProduto(produtoId)
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscarEventos = useCallback((sinal: AbortSignal) => listarEventos(produtoId, sinal), [produtoId])
  const eventos = useRequisicao<EventResponse[]>(buscarEventos, produto.dados !== null)
  const [abaAtiva, setAbaAtiva] = useState('dados')
  const tituloRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    if (produto.dados) tituloRef.current?.focus()
  }, [produto.dados])

  return { temPerfil, produto, eventos, abaAtiva, setAbaAtiva, tituloRef }
}
