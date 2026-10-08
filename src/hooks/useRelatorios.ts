import type { SetStateAction } from 'react'
import { useCallback, useMemo, useState } from 'react'
import {
enviarRelatorio,
gerarPrevia,
listarRecicladoras,
listarRelatorios,
} from '../services/relatorioService'
import { mensagemDeErro } from '../types/api'
import type { EstadoLocalRelatorios } from '../types/controles/EstadoLocalRelatorios'
import type { PreviaRelatorio, Recicladora, Relatorio } from '../types/relatorio'
import { pluralizar } from '../utils/formatacao'
import { validarEnvioRelatorio } from '../utils/validacao'
import { useAuth } from './useAuth'
import { useRequisicao } from './useRequisicao'
import { useToast } from './useToast'

export function useRelatorios() {
  const { temPerfil, usuario } = useAuth()
  const podeEnviar = temPerfil(['administrador'])

  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscarRelatorios = useCallback((sinal: AbortSignal) => listarRelatorios(sinal), [])

  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscarRecicladoras = useCallback((sinal: AbortSignal) => listarRecicladoras(sinal), [])

  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscarPrevia = useCallback((sinal: AbortSignal) => gerarPrevia(sinal), [])
  const relatorios = useRequisicao<Relatorio[]>(buscarRelatorios)
  const recicladoras = useRequisicao<Recicladora[]>(buscarRecicladoras)
  const [toast, mostrarToast] = useToast()
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalRelatorios>(() => ({
    modalAberto: false,
    etapa: 'previa',
    recicladoraId: '',
    erroRecicladora: null,
    enviando: false,
    erroEnvio: null,
  }))
  const { modalAberto, etapa, recicladoraId, erroRecicladora, enviando, erroEnvio } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setModalAberto, setEtapa, setRecicladoraId, setErroRecicladora, setEnviando, setErroEnvio } = useMemo(() => ({
    setModalAberto: (valor: SetStateAction<EstadoLocalRelatorios['modalAberto']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.modalAberto) : valor
      return Object.is(atual.modalAberto, proximo) ? atual : { ...atual, modalAberto: proximo }
    }),
    setEtapa: (valor: SetStateAction<EstadoLocalRelatorios['etapa']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.etapa) : valor
      return Object.is(atual.etapa, proximo) ? atual : { ...atual, etapa: proximo }
    }),
    setRecicladoraId: (valor: SetStateAction<EstadoLocalRelatorios['recicladoraId']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.recicladoraId) : valor
      return Object.is(atual.recicladoraId, proximo) ? atual : { ...atual, recicladoraId: proximo }
    }),
    setErroRecicladora: (valor: SetStateAction<EstadoLocalRelatorios['erroRecicladora']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erroRecicladora) : valor
      return Object.is(atual.erroRecicladora, proximo) ? atual : { ...atual, erroRecicladora: proximo }
    }),
    setEnviando: (valor: SetStateAction<EstadoLocalRelatorios['enviando']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.enviando) : valor
      return Object.is(atual.enviando, proximo) ? atual : { ...atual, enviando: proximo }
    }),
    setErroEnvio: (valor: SetStateAction<EstadoLocalRelatorios['erroEnvio']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erroEnvio) : valor
      return Object.is(atual.erroEnvio, proximo) ? atual : { ...atual, erroEnvio: proximo }
    }),
  }), [])
  const previa = useRequisicao<PreviaRelatorio>(buscarPrevia, modalAberto)

  // Evita recalcular o valor enquanto suas dependências permanecem iguais.
  const recicladoraSelecionada = useMemo(
    () =>
      recicladoras.dados?.find((recicladora) => String(recicladora.id) === recicladoraId) ?? null,
    [recicladoras.dados, recicladoraId],
  )

  // Evita recalcular o valor enquanto suas dependências permanecem iguais.
  const categoriasDaPrevia = useMemo(() => {
    const contagem = new Map<string, number>()
    for (const item of previa.dados?.itens ?? []) {
      contagem.set(item.categoriaNome, (contagem.get(item.categoriaNome) ?? 0) + 1)
    }
    return [...contagem].map(([nome, quantidade]) => ({ nome, quantidade }))
  }, [previa.dados])
  const dataDaPrevia = new Date().toISOString().slice(0, 10)

  function abrirPrevia() {
    setEtapa('previa')
    setRecicladoraId('')
    setErroRecicladora(null)
    setErroEnvio(null)
    setModalAberto(true)
  }

  function aoRevisar() {
    if (!podeEnviar) return
    const validacao = validarEnvioRelatorio({ recicladoraId: Number(recicladoraId) })
    setErroRecicladora(validacao.erros.recicladoraId ?? null)
    if (!validacao.valido) return
    setEtapa('confirmacao')
  }

  async function aoConfirmarEnvio() {
    if (!podeEnviar || !previa.dados) return
    setEnviando(true)
    setErroEnvio(null)
    try {
      const relatorio = await enviarRelatorio({
        recicladoraId: Number(recicladoraId),
        produtoIds: previa.dados.itens.map((item) => item.produtoId),
      })
      setModalAberto(false)
      mostrarToast(
        `Relatório de ${relatorio.periodo} enviado para ${relatorio.recicladoraNome}: ${relatorio.totalItens} ${pluralizar(relatorio.totalItens, 'item marcado', 'itens marcados')} como descartados.`,
      )
      relatorios.recarregar()
    } catch (falha) {
      setEtapa('previa')
      setErroEnvio(mensagemDeErro(falha))
    } finally {
      setEnviando(false)
    }
  }
  return {
    usuario,
    podeEnviar,
    relatorios,
    recicladoras,
    toast,
    modalAberto,
    setModalAberto,
    etapa,
    setEtapa,
    recicladoraId,
    setRecicladoraId,
    erroRecicladora,
    setErroRecicladora,
    enviando,
    erroEnvio,
    previa,
    recicladoraSelecionada,
    categoriasDaPrevia,
    dataDaPrevia,
    abrirPrevia,
    aoRevisar,
    aoConfirmarEnvio,
  }
}
