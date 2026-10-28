import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { buscarLocaisReciclagem } from '../services/descarteService'
import { validarBuscaLocais } from '../utils/validacaoDescarte'
import { mensagemDeErro } from '../types/api'
import type { EstadoBuscaLocais, FormBuscaLocais, RetornoBuscaLocais } from '../types/locaisReciclagem'

export function useLocaisReciclagem(): RetornoBuscaLocais {
  const [estado, setEstado] = useState<EstadoBuscaLocais>({
    form: { lat: '', lng: '', radiusMeters: '' }, erros: {}, locais: null, carregando: false, erro: null,
    localizando: false, feedbackLocalizacao: '', erroLocalizacao: null,
  })
  const montado = useRef(false)
  const buscaAtual = useRef<AbortController | null>(null)
  const localizacaoAtual = useRef(0)
  useEffect(() => {
    montado.current = true
    return () => { montado.current = false; buscaAtual.current?.abort(); localizacaoAtual.current += 1 }
  }, [])
  function alterar(campo: keyof FormBuscaLocais, valor: string) {
    localizacaoAtual.current += 1
    setEstado((atual) => ({ ...atual, form: { ...atual.form, [campo]: valor }, erros: { ...atual.erros, [campo]: undefined }, erro: null, localizando: false, feedbackLocalizacao: '', erroLocalizacao: null }))
  }
  function usarLocalizacao() {
    if (!navigator.geolocation || !window.isSecureContext) {
      setEstado((atual) => ({ ...atual, erroLocalizacao: 'A localização não está disponível neste navegador. Informe as coordenadas manualmente.' }))
      return
    }
    const pedido = ++localizacaoAtual.current
    setEstado((atual) => ({ ...atual, localizando: true, erroLocalizacao: null, feedbackLocalizacao: 'Aguardando sua localização…' }))
    navigator.geolocation.getCurrentPosition(
      (posicao: GeolocationPosition) => {
        if (!montado.current || pedido !== localizacaoAtual.current) return
        setEstado((atual) => ({ ...atual, localizando: false, form: { ...atual.form, lat: String(posicao.coords.latitude), lng: String(posicao.coords.longitude) }, erros: { ...atual.erros, lat: undefined, lng: undefined }, feedbackLocalizacao: 'Localização preenchida. Confira o raio e busque os locais.' }))
      },
      (falha: GeolocationPositionError) => {
        if (!montado.current || pedido !== localizacaoAtual.current) return
        const mensagem = falha.code === 1 ? 'A permissão de localização foi recusada. Você pode informar as coordenadas manualmente.'
          : falha.code === 3 ? 'A localização demorou a responder. Tente novamente ou informe as coordenadas manualmente.'
            : 'Não foi possível determinar sua localização. Informe as coordenadas manualmente.'
        setEstado((atual) => ({ ...atual, localizando: false, feedbackLocalizacao: '', erroLocalizacao: mensagem }))
      },
      { enableHighAccuracy: false, timeout: 15_000, maximumAge: 60_000 },
    )
  }
  async function buscar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    const form = estado.form
    const validacao = validarBuscaLocais({
      lat: form.lat.trim() ? Number(form.lat) : Number.NaN,
      lng: form.lng.trim() ? Number(form.lng) : Number.NaN,
      ...(form.radiusMeters.trim() ? { radiusMeters: Number(form.radiusMeters) } : {}),
    })
    setEstado((atual) => ({ ...atual, erros: validacao.erros, erro: null }))
    if (!validacao.valido) {
      document.getElementById(`locais-${Object.keys(validacao.erros)[0]}`)?.focus()
      return
    }
    buscaAtual.current?.abort()
    const controlador = new AbortController()
    buscaAtual.current = controlador
    setEstado((atual) => ({ ...atual, carregando: true, locais: null }))
    try {
      const locais = await buscarLocaisReciclagem(validacao.dados, controlador.signal)
      if (montado.current && !controlador.signal.aborted) setEstado((atual) => ({ ...atual, locais }))
    } catch (erro: unknown) {
      if (montado.current && !controlador.signal.aborted) setEstado((atual) => ({ ...atual, erro: mensagemDeErro(erro) }))
    } finally {
      if (montado.current && !controlador.signal.aborted) setEstado((atual) => ({ ...atual, carregando: false }))
    }
  }
  return { ...estado, alterar, buscar, usarLocalizacao }
}
