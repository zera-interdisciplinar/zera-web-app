import type { SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { modoDemonstracao } from '../services/apiReal'
import { listarEventos } from '../services/cicloService'
import {
analisarPreventiva,
listarManutencoes,
registrarManutencao,
} from '../services/manutencaoService'
import { mensagemDeErro } from '../types/api'
import type { EventResponse } from '../types/apiReal'
import type { EstadoLocalDetalheItem } from '../types/controles/EstadoLocalDetalheItem'
import type { AnalisePreventiva, Manutencao, TipoManutencao } from '../types/manutencao'
import { sanitizarTexto } from '../utils/sanitizacao'
import { useAuth } from './useAuth'
import { useProduto } from './useProduto'
import { useRequisicao } from './useRequisicao'
interface FormManutencao {
  tipo: TipoManutencao
  descricao: string
  tecnico: string
}
const FORM_INICIAL: FormManutencao = { tipo: 'preventiva', descricao: '', tecnico: '' }

export function useDetalheItem({ produtoId }: { produtoId: number | string }) {
  const { temPerfil } = useAuth()
  const navegar = useNavigate()
  const produto = useProduto(produtoId)

  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscarEventos = useCallback((sinal: AbortSignal) => listarEventos(produtoId, sinal), [produtoId])
  const eventos = useRequisicao<EventResponse[]>(buscarEventos, !modoDemonstracao && produto.dados !== null)

  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscarManutencoes = useCallback(
    (sinal: AbortSignal) => listarManutencoes(produtoId, sinal),
    [produtoId],
  )

  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscarAnalise = useCallback(
    (sinal: AbortSignal) => analisarPreventiva(produtoId, sinal),
    [produtoId],
  )
  const manutencoes = useRequisicao<Manutencao[]>(buscarManutencoes, modoDemonstracao)
  const analise = useRequisicao<AnalisePreventiva>(buscarAnalise, modoDemonstracao)
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalDetalheItem>(() => ({
    abaAtiva: 'dados',
    form: FORM_INICIAL,
    erroForm: null,
    enviando: false,
    sucesso: null,
  }))
  const { abaAtiva, form, erroForm, enviando, sucesso } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setAbaAtiva, setForm, setErroForm, setEnviando, setSucesso } = useMemo(() => ({
    setAbaAtiva: (valor: SetStateAction<EstadoLocalDetalheItem['abaAtiva']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.abaAtiva) : valor
      return Object.is(atual.abaAtiva, proximo) ? atual : { ...atual, abaAtiva: proximo }
    }),
    setForm: (valor: SetStateAction<EstadoLocalDetalheItem['form']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.form) : valor
      return Object.is(atual.form, proximo) ? atual : { ...atual, form: proximo }
    }),
    setErroForm: (valor: SetStateAction<EstadoLocalDetalheItem['erroForm']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erroForm) : valor
      return Object.is(atual.erroForm, proximo) ? atual : { ...atual, erroForm: proximo }
    }),
    setEnviando: (valor: SetStateAction<EstadoLocalDetalheItem['enviando']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.enviando) : valor
      return Object.is(atual.enviando, proximo) ? atual : { ...atual, enviando: proximo }
    }),
    setSucesso: (valor: SetStateAction<EstadoLocalDetalheItem['sucesso']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.sucesso) : valor
      return Object.is(atual.sucesso, proximo) ? atual : { ...atual, sucesso: proximo }
    }),
  }), [])
  const tituloRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    if (produto.dados) tituloRef.current?.focus()
  }, [produto.dados])

  async function aoRegistrarManutencao(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroForm(null)
    setSucesso(null)

    const descricao = sanitizarTexto(form.descricao).slice(0, 280)
    const tecnico = sanitizarTexto(form.tecnico).slice(0, 80)
    if (descricao.length < 10) {
      setErroForm('Descreva o que foi feito com pelo menos 10 caracteres.')
      return
    }
    if (tecnico.length < 3) {
      setErroForm('Informe o nome do técnico responsável.')
      return
    }

    setEnviando(true)
    try {
      await registrarManutencao({ produtoId, tipo: form.tipo, descricao, tecnico })
      setForm(FORM_INICIAL)
      setSucesso('Manutenção registrada. O histórico e a análise preventiva foram atualizados.')
      manutencoes.recarregar()
      analise.recarregar()
    } catch (falha) {
      setErroForm(mensagemDeErro(falha))
    } finally {
      setEnviando(false)
    }
  }
  return {
    temPerfil,
    navegar,
    produto,
    eventos,
    manutencoes,
    analise,
    abaAtiva,
    setAbaAtiva,
    form,
    setForm,
    erroForm,
    enviando,
    sucesso,
    tituloRef,
    aoRegistrarManutencao,
  }
}
