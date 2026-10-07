import { useCallback, useEffect, useMemo, useState } from 'react'
import { mensagemDeErro } from '../types/api'

export interface EstadoRequisicao<T> {
  dados: T | null
  carregando: boolean
  erro: string | null
  recarregar: () => void
}

interface IdentificadorRequisicao<T> {
  buscar: (sinal: AbortSignal) => Promise<T>
  ativo: boolean
  gatilho: number
}

export function useRequisicao<T>(
  buscar: (sinal: AbortSignal) => Promise<T>,
  ativo: boolean = true,
): EstadoRequisicao<T> {
  const [resultado, setResultado] = useState<{
    dados: T | null
    erro: string | null
    requisicao: IdentificadorRequisicao<T> | null
  }>({ dados: null, erro: null, requisicao: null })
  const [gatilho, setGatilho] = useState(0)
  const requisicao = useMemo(() => ({ buscar, ativo, gatilho }), [buscar, ativo, gatilho])

  useEffect(() => {
    if (!ativo) return

    const controlador = new AbortController()
    let vivo = true

    Promise.resolve().then(() => {
      if (controlador.signal.aborted) throw new DOMException('Requisição cancelada.', 'AbortError')
      return buscar(controlador.signal)
    })
      .then((resultado) => {
        if (!vivo || controlador.signal.aborted) return
        setResultado({ dados: resultado, erro: null, requisicao })
      })
      .catch((falha: unknown) => {
        if (!vivo || controlador.signal.aborted) return
        if (falha instanceof DOMException && falha.name === 'AbortError') return
        setResultado({ dados: null, erro: mensagemDeErro(falha), requisicao })
      })

    return () => {
      vivo = false
      controlador.abort()
    }
  }, [buscar, ativo, gatilho, requisicao])

  const recarregar = useCallback(() => {
    setGatilho((valor) => valor + 1)
  }, [])

  const carregando = ativo && resultado.requisicao !== requisicao

  return {
    dados: ativo && !carregando ? resultado.dados : null,
    carregando,
    erro: ativo && !carregando ? resultado.erro : null,
    recarregar,
  }
}
