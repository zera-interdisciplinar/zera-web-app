import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import emblema from '../../assets/z-mark.png'
import { useAcessibilidade } from '../../hooks/useAcessibilidade'
import type { PreferenciasAcessibilidade, SimulacaoCores } from '../../types/acessibilidade'
import estilos from './BarraAcessibilidade.module.css'
import { LeituraConteudo } from '../LeituraConteudo'

interface ResultadoVoz {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

interface ReconhecimentoVoz {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((evento: ResultadoVoz) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type ConstrutorVoz = new () => ReconhecimentoVoz

interface JanelaComVoz extends Window {
  SpeechRecognition?: ConstrutorVoz
  webkitSpeechRecognition?: ConstrutorVoz
}

const destinosVoz: Record<string, string> = {
  'ir para painel': '/',
  'ir para itens': '/itens',
  'ir para modelos': '/modelos',
  'ir para recicladoras': '/recicladoras',
  'ir para funcionários': '/funcionarios',
  'ir para relatórios': '/relatorios',
  'ir para configurações': '/configuracoes',
  'ir para login': '/login',
}

const tamanhos = [100, 115, 130, 150, 200]

export function BarraAcessibilidade() {
  const { preferencias, alterar, restaurar } = useAcessibilidade()
  const navegar = useNavigate()
  const localizacao = useLocation()
  const [aberto, setAberto] = useState(false)
  const [ajudaAberta, setAjudaAberta] = useState(false)
  const [ouvindo, setOuvindo] = useState(false)
  const [mensagemVoz, setMensagemVoz] = useState('')
  const [guiaY, setGuiaY] = useState(0)
  const gatilhoRef = useRef<HTMLButtonElement>(null)
  const tituloRef = useRef<HTMLHeadingElement>(null)
  const painelRef = useRef<HTMLElement>(null)
  const vozRef = useRef<ReconhecimentoVoz | null>(null)
  const construtorVoz = typeof window === 'undefined' ? undefined :
    (window as JanelaComVoz).SpeechRecognition ?? (window as JanelaComVoz).webkitSpeechRecognition

  useEffect(() => {
    if (aberto) tituloRef.current?.focus()
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    const aoMudarFoco = (evento: FocusEvent) => {
      const alvo = evento.target
      if (!(alvo instanceof Node)) return
      if (!painelRef.current?.contains(alvo) && !gatilhoRef.current?.contains(alvo)) {
        setAberto(false)
        setAjudaAberta(false)
        vozRef.current?.stop()
        setOuvindo(false)
      }
    }
    document.addEventListener('focusin', aoMudarFoco)
    return () => document.removeEventListener('focusin', aoMudarFoco)
  }, [aberto])

  useEffect(() => {
    if (!aberto) return
    const aoTeclar = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        setAberto(false)
        setAjudaAberta(false)
        vozRef.current?.stop()
        setOuvindo(false)
        gatilhoRef.current?.focus()
      }
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  useEffect(() => {
    if (!preferencias.guiaLeitura) return
    const atualizar = (evento: PointerEvent) => setGuiaY(evento.clientY)
    window.addEventListener('pointermove', atualizar, { passive: true })
    return () => window.removeEventListener('pointermove', atualizar)
  }, [preferencias.guiaLeitura])

  useEffect(() => () => vozRef.current?.stop(), [])

  useEffect(() => {
    const aoOcultar = () => {
      if (!document.hidden) return
      vozRef.current?.stop()
      setOuvindo(false)
      setMensagemVoz('Escuta encerrada ao sair da página.')
    }
    document.addEventListener('visibilitychange', aoOcultar)
    return () => document.removeEventListener('visibilitychange', aoOcultar)
  }, [])

  function fechar() {
    vozRef.current?.stop()
    setOuvindo(false)
    setAberto(false)
    setAjudaAberta(false)
    gatilhoRef.current?.focus()
  }

  function alternar<K extends keyof PreferenciasAcessibilidade>(chave: K) {
    alterar({ [chave]: !preferencias[chave] })
  }

  function iniciarVoz() {
    if (!construtorVoz) return
    if (ouvindo) {
      vozRef.current?.stop()
      setOuvindo(false)
      setMensagemVoz('Escuta encerrada.')
      return
    }
    const reconhecimento = new construtorVoz()
    reconhecimento.lang = 'pt-BR'
    reconhecimento.continuous = false
    reconhecimento.interimResults = false
    reconhecimento.onresult = (evento) => {
      const frase = evento.results[0]?.[0]?.transcript.toLocaleLowerCase('pt-BR').trim() ?? ''
      const destino = destinosVoz[frase]
      if (destino) {
        navegar(destino)
        setMensagemVoz(`Comando reconhecido: ${frase}.`)
      } else {
        setMensagemVoz('Comando não reconhecido. Use os links de navegação ou tente novamente.')
      }
    }
    reconhecimento.onerror = () => {
      setOuvindo(false)
      setMensagemVoz('Não foi possível usar o microfone. Navegue pelos links ou pelo teclado.')
    }
    reconhecimento.onend = () => setOuvindo(false)
    vozRef.current = reconhecimento
    try {
      reconhecimento.start()
      setOuvindo(true)
      setMensagemVoz('Escutando um comando de navegação em português.')
    } catch {
      setMensagemVoz('Não foi possível iniciar o reconhecimento de voz.')
    }
  }

  return (
    <>
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
        <defs>
          <filter id="simulacao-protanopia"><feColorMatrix type="matrix" values=".567 .433 0 0 0 .558 .442 0 0 0 0 .242 .758 0 0 0 0 0 1 0" /></filter>
          <filter id="simulacao-deuteranopia"><feColorMatrix type="matrix" values=".625 .375 0 0 0 .7 .3 0 0 0 0 .3 .7 0 0 0 0 0 1 0" /></filter>
          <filter id="simulacao-tritanopia"><feColorMatrix type="matrix" values=".95 .05 0 0 0 0 .433 .567 0 0 0 .475 .525 0 0 0 0 0 1 0" /></filter>
        </defs>
      </svg>
      {preferencias.guiaLeitura && guiaY > 0 && (
        <div className={estilos.guia} style={{ top: guiaY }} aria-hidden="true" />
      )}
      <div className={estilos.container} data-acessibilidade>
          <section className={estilos.painel} id="painel-acessibilidade" ref={painelRef} hidden={!aberto} aria-labelledby="titulo-acessibilidade">
            <div className={`${estilos.cabecalho} sobre-navy`}>
              <h2 id="titulo-acessibilidade" ref={tituloRef} tabIndex={-1}>Acessibilidade</h2>
              <button type="button" onClick={fechar} aria-label="Fechar painel de acessibilidade">Fechar</button>
            </div>
            <div className={estilos.corpo}>
              <label htmlFor="tamanho-texto">Tamanho do texto</label>
              <select id="tamanho-texto" value={preferencias.tamanhoTexto} onChange={(evento) => alterar({ tamanhoTexto: Number(evento.target.value) })}>
                {tamanhos.map((tamanho) => <option key={tamanho} value={tamanho}>{tamanho}%</option>)}
              </select>
              <label className={estilos.opcao} htmlFor="contraste-alto"><input id="contraste-alto" type="checkbox" checked={preferencias.contrasteAlto} onChange={() => alternar('contrasteAlto')} /> Alto contraste</label>
              <label className={estilos.opcao} htmlFor="espacamento-texto"><input id="espacamento-texto" type="checkbox" checked={preferencias.espacamento} onChange={() => alternar('espacamento')} /> Espaçar letras, linhas e parágrafos</label>
              <label className={estilos.opcao} htmlFor="modo-foco"><input id="modo-foco" type="checkbox" checked={preferencias.modoFoco} onChange={() => alternar('modoFoco')} /> Modo de foco</label>
              <label className={estilos.opcao} htmlFor="fonte-legivel"><input id="fonte-legivel" type="checkbox" checked={preferencias.fonteLegivel} onChange={() => alternar('fonteLegivel')} /> Fonte legível alternativa</label>
              <label className={estilos.opcao} htmlFor="guia-leitura"><input id="guia-leitura" type="checkbox" checked={preferencias.guiaLeitura} onChange={() => alternar('guiaLeitura')} /> Guia de leitura com o ponteiro</label>
              <label htmlFor="simulacao-cores">Simulação de visão de cores</label>
              <select id="simulacao-cores" value={preferencias.simulacaoCores} onChange={(evento) => alterar({ simulacaoCores: evento.target.value as SimulacaoCores })}>
                <option value="nenhuma">Desligada</option>
                <option value="protanopia">Simular protanopia</option>
                <option value="deuteranopia">Simular deuteranopia</option>
                <option value="tritanopia">Simular tritanopia</option>
              </select>
              <p className={estilos.aviso}>Simulações aproximadas para inspeção visual; não corrigem a percepção de cores.</p>
              {aberto && <LeituraConteudo key={localizacao.key} />}
              {construtorVoz ? (
                <button type="button" onClick={iniciarVoz} aria-pressed={ouvindo}>{ouvindo ? 'Parar escuta' : 'Ativar comando de voz'}</button>
              ) : <p>Comandos de voz não disponíveis neste navegador. Use os links ou o teclado.</p>}
              <p className={estilos.aviso}>O microfone só é ativado ao escolher o botão e para após um comando. O processamento de voz depende do navegador e pode usar serviços externos.</p>
              <p role="status" aria-live="polite">{mensagemVoz}</p>
              <button type="button" aria-expanded={ajudaAberta} aria-controls="ajuda-atalhos" onClick={() => setAjudaAberta((atual) => !atual)}>Ajuda de teclado</button>
              {ajudaAberta && <div id="ajuda-atalhos"><p><kbd>Tab</kbd> e <kbd>Shift+Tab</kbd>: avançar e voltar entre controles.</p><p><kbd>Enter</kbd> ou <kbd>Espaço</kbd>: acionar o controle em foco.</p><p><kbd>Escape</kbd>: fechar este painel.</p><p>Use “Pular para o conteúdo” no início da página.</p><p>Voz: “ir para painel”, “ir para itens”, “ir para modelos”, “ir para recicladoras”, “ir para funcionários”, “ir para relatórios”, “ir para configurações” ou “ir para login”. Rotas restritas exigem permissão.</p></div>}
              <button type="button" onClick={restaurar}>Restaurar preferências</button>
            </div>
          </section>
        <button className={estilos.gatilho} ref={gatilhoRef} type="button" aria-label="Abrir opções de acessibilidade" aria-expanded={aberto} aria-controls="painel-acessibilidade" onClick={() => aberto ? fechar() : setAberto(true)}>
          <img src={emblema} alt="" />
        </button>
      </div>
    </>
  )
}
