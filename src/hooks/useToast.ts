import { useCallback, useEffect, useRef, useState } from 'react'

export function useToast(): [string | null, (mensagem: string) => void] {
  const [mensagem, setMensagem] = useState<string | null>(null)
  const temporizador = useRef<number | null>(null)

  const mostrar = useCallback((texto: string) => {
    setMensagem(texto)
    if (temporizador.current !== null) window.clearTimeout(temporizador.current)
    temporizador.current = window.setTimeout(() => setMensagem(null), 4200)
  }, [])

  useEffect(
    () => () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current)
    },
    [],
  )

  return [mensagem, mostrar]
}
