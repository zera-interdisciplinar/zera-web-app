import { useCallback, useEffect, useReducer, useRef } from 'react'
import { pickLocalVoice, splitForSpeech, textToRead } from './readAloud'

interface State { speaking: boolean; message: string }
type Action = { type: 'start' } | { type: 'stop'; message: string }

function reducer(state: State, action: Action): State {
  return action.type === 'start'
    ? { speaking: true, message: 'Lendo em português com uma voz local. Use Parar leitura para encerrar.' }
    : { ...state, speaking: false, message: action.message }
}

export function useReadAloud() {
  const [state, dispatch] = useReducer(reducer, { speaking: false, message: '' })
  const generation = useRef(0)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window

  // Cancelling bumps the generation, which turns every pending callback of the previous reading into a no-op.
  const cancel = useCallback(() => {
    generation.current += 1
    if (supported) window.speechSynthesis.cancel()
  }, [supported])

  useEffect(() => {
    const onHide = () => {
      if (!document.hidden) return
      cancel()
      dispatch({ type: 'stop', message: 'Leitura interrompida ao sair da página.' })
    }
    document.addEventListener('visibilitychange', onHide)
    return () => { document.removeEventListener('visibilitychange', onHide); cancel() }
  }, [cancel])

  function toggle() {
    if (!supported) return
    if (state.speaking) { cancel(); dispatch({ type: 'stop', message: 'Leitura encerrada.' }); return }
    cancel()
    const voice = pickLocalVoice(window.speechSynthesis.getVoices())
    if (!voice) { dispatch({ type: 'stop', message: 'Nenhuma voz local em português disponível. Use o leitor de tela do seu sistema.' }); return }
    const chunks = splitForSpeech(textToRead())
    if (!chunks.length) { dispatch({ type: 'stop', message: 'Não há texto visível para ler neste momento.' }); return }
    const mine = generation.current
    dispatch({ type: 'start' })
    const speak = (index: number) => {
      if (mine !== generation.current) return
      const utterance = new SpeechSynthesisUtterance(chunks[index])
      utterance.lang = voice.lang
      utterance.voice = voice
      utterance.onend = () => {
        if (mine !== generation.current) return
        if (index + 1 < chunks.length) speak(index + 1)
        else dispatch({ type: 'stop', message: 'Leitura concluída.' })
      }
      utterance.onerror = () => {
        if (mine !== generation.current) return
        cancel()
        dispatch({ type: 'stop', message: 'Não foi possível continuar a leitura. Use o leitor de tela do seu sistema.' })
      }
      window.speechSynthesis.speak(utterance)
    }
    speak(0)
  }

  return { supported, speaking: state.speaking, message: state.message, toggle }
}
