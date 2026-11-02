import { useEffect, useId, useReducer, useRef } from 'react'
import { useAccessibility } from '../../hooks/useAccessibility'
import { useReadAloud } from '../../hooks/useReadAloud'
import { useVoiceNavigation } from '../../hooks/useVoiceNavigation'
import { TEXT_SCALES } from '../../utils/accessibilityPreferences'
import styles from '../../../styles/components/AccessibilityPanel/AccessibilityPanel.module.css'
import type { AccessibilityPanelProps } from '../../types/componentes/AccessibilityPanel'

interface PanelState { open: boolean; help: boolean; pointerY: number }
type PanelAction = { type: 'toggle' } | { type: 'close' } | { type: 'help' } | { type: 'pointer'; y: number }

function reducer(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'toggle': return { ...state, open: !state.open, help: false }
    case 'close': return { ...state, open: false, help: false }
    case 'help': return { ...state, help: !state.help }
    case 'pointer': return { ...state, pointerY: action.y }
  }
}

/**
 * Non-modal dialog: it stays open while the person tabs through the page to check an effect.
 * It closes only with "Fechar", Esc or the trigger, and focus goes back to the trigger (A-1).
 */
export function AccessibilityPanel({ routes }: AccessibilityPanelProps) {
  const { preferences, update, reset } = useAccessibility()
  const readAloud = useReadAloud()
  const voice = useVoiceNavigation(routes)
  const [state, dispatch] = useReducer(reducer, { open: false, help: false, pointerY: 0 })
  const trigger = useRef<HTMLButtonElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const id = useId()

  useEffect(() => {
    if (state.open) heading.current?.focus()
  }, [state.open])

  useEffect(() => {
    if (!state.open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      dispatch({ type: 'close' })
      trigger.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [state.open])

  useEffect(() => {
    if (!preferences.readingGuide) return
    const onMove = (event: PointerEvent) => dispatch({ type: 'pointer', y: event.clientY })
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [preferences.readingGuide])

  const checkbox = (key: 'highContrast' | 'textSpacing' | 'reduceMotion' | 'readableFont' | 'readingGuide', label: string) => (
    <label className={styles.option} htmlFor={`${id}-${key}`}>
      <input id={`${id}-${key}`} type="checkbox" checked={preferences[key]} onChange={() => update({ [key]: !preferences[key] })} /> {label}
    </label>
  )

  return (
    <>
      {preferences.readingGuide && state.pointerY > 0 && <div className={styles.guide} style={{ top: state.pointerY }} aria-hidden="true" />}
      <div className={styles.container} data-accessibility>
        <section id={`${id}-panel`} className={styles.panel} role="dialog" aria-modal="false" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} hidden={!state.open}>
          <p id={`${id}-description`} className="somente-leitor-de-tela">Opções para ajustar a leitura, o contraste, o movimento e a navegação por teclado.</p>
          <div className={styles.header}>
            <h2 id={`${id}-title`} ref={heading} tabIndex={-1}>Acessibilidade</h2>
            <button type="button" onClick={() => { dispatch({ type: 'close' }); trigger.current?.focus() }}>Fechar</button>
          </div>
          <div className={styles.body}>
            <label htmlFor={`${id}-scale`}>Tamanho do texto</label>
            <select id={`${id}-scale`} value={preferences.textScale} onChange={(event) => update({ textScale: Number(event.target.value) })}>
              {TEXT_SCALES.map((scale) => <option key={scale} value={scale}>{scale}%</option>)}
            </select>
            {checkbox('highContrast', 'Alto contraste')}
            {checkbox('textSpacing', 'Espaçar letras, palavras, linhas e parágrafos')}
            {checkbox('reduceMotion', 'Reduzir movimento')}
            {checkbox('readableFont', 'Fonte de leitura facilitada')}
            {checkbox('readingGuide', 'Guia de leitura com o ponteiro')}
            <button type="button" onClick={readAloud.toggle} disabled={!readAloud.supported} aria-pressed={readAloud.speaking}>
              {readAloud.speaking ? 'Parar leitura' : 'Ler em voz alta'}
            </button>
            <p className={styles.note}>Lê o texto selecionado ou, sem seleção, o conteúdo da página, com voz local em português. Campos de formulário e gráficos não são lidos. Para navegar por controles e tabelas, use o leitor de tela do sistema.</p>
            {!readAloud.supported && <p className={styles.note}>Leitura em voz alta não disponível neste navegador.</p>}
            <p role="status" aria-atomic="true">{readAloud.message}</p>
            {voice.supported
              ? <button type="button" onClick={voice.toggle} aria-pressed={voice.listening}>{voice.listening ? 'Parar escuta' : 'Ativar comando de voz'}</button>
              : <p className={styles.note}>Comandos de voz não disponíveis neste navegador. Use os links ou o teclado.</p>}
            <p className={styles.note}>O microfone só é ativado ao escolher o botão e para após um comando. O processamento de voz depende do navegador e pode usar serviços externos.</p>
            <p role="status" aria-live="polite">{voice.message}</p>
            <button type="button" aria-expanded={state.help} aria-controls={`${id}-help`} onClick={() => dispatch({ type: 'help' })}>Ajuda de teclado</button>
            {state.help && (
              <div id={`${id}-help`}>
                <p><kbd>Tab</kbd> e <kbd>Shift+Tab</kbd>: avançar e voltar entre controles.</p>
                <p><kbd>Enter</kbd> ou <kbd>Espaço</kbd>: acionar o controle em foco.</p>
                <p><kbd>Esc</kbd>: fechar este painel.</p>
                <p>Use “Pular para o conteúdo” no início da página.</p>
                <p>Voz: {routes.map((route) => `“ir para ${route.phrase}”`).join(', ')}.</p>
              </div>
            )}
            <button type="button" onClick={reset}>Restaurar preferências</button>
          </div>
        </section>
        <button
          className={styles.trigger} ref={trigger} type="button" aria-label="Abrir opções de acessibilidade"
          aria-expanded={state.open} aria-controls={`${id}-panel`} onClick={() => dispatch({ type: 'toggle' })}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="4.5" r="2" /><path d="M5 8.5h14M12 8.5V14m0 0-3.5 6M12 14l3.5 6" /></svg>
        </button>
      </div>
    </>
  )
}
