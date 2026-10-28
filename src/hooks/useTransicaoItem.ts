import { useEffect, useRef, useState } from 'react'
import type { FormEvent, RefObject } from 'react'
import type { ProdutoDetalhado } from '../types/produto'
import type { AcaoItemReal, DadosTransicaoItem } from '../types/transicaoItem'
import type { ErrosDeCampo } from '../utils/validacao'
import { mensagemDeErro } from '../types/api'
import { acoesDisponiveisItem, validarTransicaoItem } from '../utils/validacaoTransicaoItem'
import { transicionarItemReal } from '../services/transicaoItemService'
import { useAuth } from './useAuth'

interface EstadoTransicao {
  acao: AcaoItemReal | null
  dados: DadosTransicaoItem
  erros: ErrosDeCampo<DadosTransicaoItem>
  erro: string | null
  enviando: boolean
  sucesso: string
}

interface RetornoTransicao extends EstadoTransicao {
  acoes: AcaoItemReal[]
  selecionar: (acao: AcaoItemReal) => void
  fechar: () => void
  alterar: (campo: keyof DadosTransicaoItem, valor: string) => void
  confirmar: (evento: FormEvent) => Promise<void>
  feedbackRef: RefObject<HTMLParagraphElement | null>
}

const SUCESSO: Record<AcaoItemReal, string> = {
  submit: 'Cadastro enviado.', approve: 'Item aprovado.', reject: 'Item reprovado.',
  'maintenance/start': 'Manutenção iniciada.', 'maintenance/finish': 'Manutenção concluída. Avalie a condição do item.',
  evaluate: 'Condição avaliada. Item devolvido ao estoque.',
}

export function useTransicaoItem(item: ProdutoDetalhado, aoConcluir: () => void): RetornoTransicao {
  const { usuario } = useAuth()
  const acoes = acoesDisponiveisItem(item.status, usuario?.perfil)
  const [estado, setEstado] = useState<EstadoTransicao>({ acao: null, dados: { reason: '', condition: 'USED' }, erros: {}, erro: null, enviando: false, sucesso: '' })
  const montado = useRef(false)
  const emEnvio = useRef(false)
  const cancelamento = useRef<AbortController | null>(null)
  const feedbackRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    montado.current = true
    return () => { montado.current = false; cancelamento.current?.abort() }
  }, [])
  useEffect(() => { if (estado.erro || estado.sucesso) feedbackRef.current?.focus() }, [estado.erro, estado.sucesso])
  function selecionar(acao: AcaoItemReal) {
    if (!emEnvio.current && acoes.includes(acao)) setEstado({ acao, dados: { reason: '', condition: 'USED' }, erros: {}, erro: null, enviando: false, sucesso: '' })
  }
  function fechar() { if (!emEnvio.current) setEstado((atual) => ({ ...atual, acao: null })) }
  function alterar(campo: keyof DadosTransicaoItem, valor: string) {
    if (campo === 'condition' && !['NEW', 'USED', 'SEMI_DAMAGED', 'DAMAGED'].includes(valor)) return
    setEstado((atual) => ({ ...atual, dados: { ...atual.dados, [campo]: valor }, erros: { ...atual.erros, [campo]: undefined } }))
  }
  async function confirmar(evento: FormEvent): Promise<void> {
    evento.preventDefault()
    if (emEnvio.current || !estado.acao || !acoes.includes(estado.acao)) return
    const validacao = validarTransicaoItem(estado.acao, estado.dados)
    if (!validacao.valido) {
      setEstado((atual) => ({ ...atual, erros: validacao.erros }))
      document.getElementById(validacao.erros.reason ? 'fluxo-item-motivo' : 'fluxo-item-condicao')?.focus()
      return
    }
    const acao = estado.acao
    emEnvio.current = true
    cancelamento.current = new AbortController()
    setEstado((atual) => ({ ...atual, enviando: true, erro: null, sucesso: '', erros: {} }))
    try {
      await transicionarItemReal(item.id, acao, validacao.dados, cancelamento.current.signal)
      if (!montado.current) return
      setEstado((atual) => ({ ...atual, acao: null, sucesso: SUCESSO[acao] }))
      aoConcluir()
    } catch (erro) {
      if (montado.current && !(erro instanceof DOMException && erro.name === 'AbortError')) setEstado((atual) => ({ ...atual, erro: mensagemDeErro(erro) }))
    } finally {
      emEnvio.current = false
      if (montado.current) setEstado((atual) => ({ ...atual, enviando: false }))
    }
  }
  return { ...estado, acoes, selecionar, fechar, alterar, confirmar, feedbackRef }
}
