import { useCallback, useEffect, useRef, useState } from 'react'
import { escolherVozLocal, obterTextoVisivel, separarTextoParaLeitura } from '../services/leituraService'

interface RetornoLeituraConteudo {
  lendo: boolean
  mensagem: string
  suportado: boolean
  alternarLeitura: () => void
}

export function useLeituraConteudo(): RetornoLeituraConteudo {
  const [{ lendo, mensagem }, setEstado] = useState({ lendo: false, mensagem: '' })
  const geracao = useRef(0)
  const falaRef = useRef<SpeechSynthesisUtterance | null>(null)
  const suportado = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  const parar = useCallback(() => {
    geracao.current += 1
    if (falaRef.current) {
      falaRef.current.onend = null
      falaRef.current.onerror = null
      falaRef.current = null
    }
    if (suportado) window.speechSynthesis.cancel()
  }, [suportado])

  useEffect(() => {
    const aoOcultar = () => {
      if (document.hidden) {
        parar()
        setEstado({ lendo: false, mensagem: 'Leitura interrompida ao sair da página.' })
      }
    }
    document.addEventListener('visibilitychange', aoOcultar)
    return () => {
      document.removeEventListener('visibilitychange', aoOcultar)
      parar()
    }
  }, [parar])

  function alternarLeitura() {
    if (!suportado) return
    if (lendo) {
      parar()
      setEstado({ lendo: false, mensagem: 'Leitura encerrada.' })
      return
    }
    parar()
    const vozLocal = escolherVozLocal(window.speechSynthesis.getVoices())
    if (!vozLocal) {
      setEstado({ lendo: false, mensagem: 'Nenhuma voz local em português disponível. Você pode usar o leitor de tela do seu sistema.' })
      return
    }
    const conteudo = document.querySelector<HTMLElement>('main')
    const trechos = conteudo ? separarTextoParaLeitura(obterTextoVisivel(conteudo)) : []
    if (!trechos.length) {
      setEstado((atual) => ({ ...atual, mensagem: 'Não há texto visível para ler neste momento.' }))
      return
    }
    const atual = geracao.current
    const voz = vozLocal
    setEstado({ lendo: true, mensagem: 'Lendo o conteúdo em português com uma voz local. Use Parar leitura para encerrar.' })
    function falar(indice: number) {
      if (atual !== geracao.current) return
      const fala = new SpeechSynthesisUtterance(trechos[indice])
      fala.lang = voz.lang
      fala.voice = voz
      falaRef.current = fala
      fala.onend = () => {
        if (atual !== geracao.current) return
        if (indice + 1 < trechos.length) falar(indice + 1)
        else {
          setEstado({ lendo: false, mensagem: 'Leitura concluída.' })
        }
      }
      fala.onerror = () => {
        if (atual !== geracao.current) return
        parar()
        setEstado({ lendo: false, mensagem: 'Não foi possível continuar a leitura. Use o leitor de tela do seu sistema ou tente novamente.' })
      }
      window.speechSynthesis.speak(fala)
    }
    falar(0)
  }

  return { lendo, mensagem, suportado, alternarLeitura }
}
