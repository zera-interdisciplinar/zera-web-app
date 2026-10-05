import { useCallback, useEffect, useState } from 'react'
import { mensagemDeErro } from '../types/api'

export interface EstadoRequisicao<T> {
  dados: T | null
  carregando: boolean
  erro: string | null
  recarregar: () => void
}

export function useRequisicao<T>(
  buscar: (sinal: AbortSignal) => Promise<T>,
  ativo: boolean = true,
): EstadoRequisicao<T> {
  const [dados, setDados] = useState<T | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [gatilho, setGatilho] = useState(0)
  const [concluida, setConcluida] = useState<{ buscar: typeof buscar; gatilho: number } | null>(
    null,
  )

  useEffect(() => {
    if (!ativo) return

    const controlador = new AbortController()
    let vivo = true

    buscar(controlador.signal)
      .then((resultado) => {
        if (!vivo) return
        setDados(resultado)
        setErro(null)
      })
      .catch((falha: unknown) => {
        if (!vivo) return
        if (falha instanceof DOMException && falha.name === 'AbortError') return
        setErro(mensagemDeErro(falha))
      })
      .finally(() => {
        if (!vivo) return
        setConcluida({ buscar, gatilho })
      })

    return () => {
      vivo = false
      controlador.abort()
    }
  }, [buscar, ativo, gatilho])

  const recarregar = useCallback(() => {
    setGatilho((valor) => valor + 1)
  }, [])

  const carregando =
    ativo && (concluida === null || concluida.buscar !== buscar || concluida.gatilho !== gatilho)

  return { dados: carregando ? null : dados, carregando, erro: carregando ? null : erro, recarregar }
}
