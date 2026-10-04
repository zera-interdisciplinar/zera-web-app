import { useCallback, useEffect, useRef, useState } from 'react'
import { escolherVozLocal, obterTextoVisivel, separarTextoParaLeitura } from '../../services/leituraService'

export function LeituraConteudo() {
  const [lendo, setLendo] = useState(false)
  const [mensagem, setMensagem] = useState('')
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
        setLendo(false)
        setMensagem('Leitura interrompida ao sair da página.')
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
      setLendo(false)
      setMensagem('Leitura encerrada.')
      return
    }
    parar()
    const vozLocal = escolherVozLocal(window.speechSynthesis.getVoices())
    if (!vozLocal) {
      setLendo(false)
      setMensagem('Nenhuma voz local em português disponível. Você pode usar o leitor de tela do seu sistema.')
      return
    }
    const conteudo = document.querySelector<HTMLElement>('main')
    const trechos = conteudo ? separarTextoParaLeitura(obterTextoVisivel(conteudo)) : []
    if (!trechos.length) {
      setMensagem('Não há texto visível para ler neste momento.')
      return
    }
    const atual = geracao.current
    const voz = vozLocal
    setLendo(true)
    setMensagem('Lendo o conteúdo em português com uma voz local. Use Parar leitura para encerrar.')
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
          setLendo(false)
          setMensagem('Leitura concluída.')
        }
      }
      fala.onerror = () => {
        if (atual !== geracao.current) return
        parar()
        setLendo(false)
        setMensagem('Não foi possível continuar a leitura. Use o leitor de tela do seu sistema ou tente novamente.')
      }
      window.speechSynthesis.speak(fala)
    }
    falar(0)
  }

  return <>
    <button type="button" onClick={alternarLeitura} disabled={!suportado} aria-pressed={lendo}>
      {lendo ? 'Parar leitura' : 'Ler conteúdo em voz alta'}
    </button>
    <p>Leitura opcional com voz local em português, sem microfone. Campos de formulário não são lidos. Para navegar por controles e tabelas, use o leitor de tela do sistema, como NVDA.</p>
    {!suportado && <p>Leitura em voz alta não disponível neste navegador.</p>}
    <p role="status" aria-atomic="true">{mensagem}</p>
  </>
}
