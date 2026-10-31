import { useEffect, useReducer, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import type { VoiceCommand } from '../types/accessibility'

interface Recognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
}
type RecognitionConstructor = new () => Recognition
type SpeechWindow = Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }

interface State { listening: boolean; message: string }
type Action = { type: 'listening'; message: string } | { type: 'stopped'; message?: string }

function reducer(state: State, action: Action): State {
  return action.type === 'listening' ? { listening: true, message: action.message } : { listening: false, message: action.message ?? state.message }
}

/** Voice navigation limited to the routes the app really has (A-8). One command per click: the microphone then stops. */
export function useVoiceNavigation(commands: VoiceCommand[]) {
  const navigate = useNavigate()
  const [state, dispatch] = useReducer(reducer, { listening: false, message: '' })
  const recognition = useRef<Recognition | null>(null)
  const Constructor = typeof window === 'undefined' ? undefined : (window as SpeechWindow).SpeechRecognition ?? (window as SpeechWindow).webkitSpeechRecognition

  useEffect(() => {
    const stop = () => recognition.current?.stop()
    const onHide = () => {
      if (!document.hidden) return
      stop()
      dispatch({ type: 'stopped', message: 'Escuta encerrada ao sair da página.' })
    }
    document.addEventListener('visibilitychange', onHide)
    return () => { document.removeEventListener('visibilitychange', onHide); stop() }
  }, [])

  function stop(message: string) {
    recognition.current?.stop()
    dispatch({ type: 'stopped', message })
  }

  function toggle() {
    if (!Constructor) return
    if (state.listening) { stop('Escuta encerrada.'); return }
    const instance = new Constructor()
    instance.lang = 'pt-BR'
    instance.continuous = false
    instance.interimResults = false
    instance.onresult = (event) => {
      const phrase = (event.results[0]?.[0]?.transcript ?? '').toLocaleLowerCase('pt-BR').trim().replace(/^ir para\s+/, '')
      const command = commands.find((item) => item.phrase === phrase)
      if (command) {
        navigate(command.path)
        dispatch({ type: 'stopped', message: `Comando reconhecido: ir para ${command.phrase}.` })
      } else {
        dispatch({ type: 'stopped', message: 'Comando não reconhecido. Use os links de navegação ou tente novamente.' })
      }
    }
    instance.onerror = () => dispatch({ type: 'stopped', message: 'Não foi possível usar o microfone. Navegue pelos links ou pelo teclado.' })
    instance.onend = () => dispatch({ type: 'stopped' })
    recognition.current = instance
    try {
      instance.start()
      dispatch({ type: 'listening', message: 'Escutando um comando de navegação em português.' })
    } catch {
      dispatch({ type: 'stopped', message: 'Não foi possível iniciar o reconhecimento de voz.' })
    }
  }

  return { supported: Boolean(Constructor), listening: state.listening, message: state.message, toggle }
}
