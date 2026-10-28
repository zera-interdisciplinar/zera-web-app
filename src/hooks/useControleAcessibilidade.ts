import type { SetStateAction } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { PreferenciasAcessibilidade } from '../types/acessibilidade'
import type { JanelaComVoz, ReconhecimentoVoz } from '../types/componentes/BarraAcessibilidade'
import type { EstadoLocalControleAcessibilidade } from '../types/controles/EstadoLocalControleAcessibilidade'
import { useAcessibilidade } from './useAcessibilidade'
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

export function useControleAcessibilidade() {
  const { preferencias, alterar, restaurar } = useAcessibilidade()
  const navegar = useNavigate()
  const localizacao = useLocation()
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalControleAcessibilidade>(() => ({
    aberto: false,
    ajudaAberta: false,
    ouvindo: false,
    mensagemVoz: '',
    guiaY: 0,
  }))
  const { aberto, ajudaAberta, ouvindo, mensagemVoz, guiaY } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setAberto, setAjudaAberta, setOuvindo, setMensagemVoz, setGuiaY } = useMemo(() => ({
    setAberto: (valor: SetStateAction<EstadoLocalControleAcessibilidade['aberto']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.aberto) : valor
      return Object.is(atual.aberto, proximo) ? atual : { ...atual, aberto: proximo }
    }),
    setAjudaAberta: (valor: SetStateAction<EstadoLocalControleAcessibilidade['ajudaAberta']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.ajudaAberta) : valor
      return Object.is(atual.ajudaAberta, proximo) ? atual : { ...atual, ajudaAberta: proximo }
    }),
    setOuvindo: (valor: SetStateAction<EstadoLocalControleAcessibilidade['ouvindo']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.ouvindo) : valor
      return Object.is(atual.ouvindo, proximo) ? atual : { ...atual, ouvindo: proximo }
    }),
    setMensagemVoz: (valor: SetStateAction<EstadoLocalControleAcessibilidade['mensagemVoz']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.mensagemVoz) : valor
      return Object.is(atual.mensagemVoz, proximo) ? atual : { ...atual, mensagemVoz: proximo }
    }),
    setGuiaY: (valor: SetStateAction<EstadoLocalControleAcessibilidade['guiaY']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.guiaY) : valor
      return Object.is(atual.guiaY, proximo) ? atual : { ...atual, guiaY: proximo }
    }),
  }), [])
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
  }, [aberto, setAberto, setAjudaAberta, setOuvindo])

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
  }, [aberto, setAberto, setAjudaAberta, setOuvindo])

  useEffect(() => {
    if (!preferencias.guiaLeitura) return
    const atualizar = (evento: PointerEvent) => setGuiaY(evento.clientY)
    window.addEventListener('pointermove', atualizar, { passive: true })
    return () => window.removeEventListener('pointermove', atualizar)
  }, [preferencias.guiaLeitura, setGuiaY])

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
  }, [setMensagemVoz, setOuvindo])

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
  return {
    preferencias,
    alterar,
    restaurar,
    localizacao,
    aberto,
    setAberto,
    ajudaAberta,
    setAjudaAberta,
    ouvindo,
    mensagemVoz,
    guiaY,
    gatilhoRef,
    tituloRef,
    painelRef,
    construtorVoz,
    fechar,
    alternar,
    iniciarVoz,
  }
}
