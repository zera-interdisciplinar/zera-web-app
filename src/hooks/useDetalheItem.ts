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
import type { EstadoLocalDetalheItem, FormManutencao } from '../types/controles/EstadoLocalDetalheItem'
import type { AnalisePreventiva, Manutencao } from '../types/manutencao'
import { validarManutencao } from '../utils/validacaoManutencao'
import { useAuth } from './useAuth'
import { useProduto } from './useProduto'
import { useRequisicao } from './useRequisicao'
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

    const validacao = validarManutencao(form)
    if (!validacao.valido) {
      setErroForm(validacao.erros.descricao ?? validacao.erros.tecnico ?? 'Revise os dados da manutenção.')
      return
    }

    setEnviando(true)
    try {
      await registrarManutencao({ produtoId, ...validacao.dados })
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
