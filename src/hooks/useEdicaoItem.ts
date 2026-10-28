import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { ProdutoDetalhado } from '../types/produto'
import type { UpdateItemRequest } from '../types/apiReal'
import { editarItemReal } from '../services/produtoService'
import { mensagemDeErro } from '../types/api'
import type { ErrosDeCampo } from '../utils/validacao'
import { validarEdicaoItem } from '../utils/validacaoInventario'
import { usePermissoes } from './usePermissoes'

interface EstadoEdicaoItem {
  aberto: boolean
  form: UpdateItemRequest
  erro: string | null
  erros: ErrosDeCampo<UpdateItemRequest>
  enviando: boolean
  sucesso: string
}

interface RetornoEdicaoItem extends EstadoEdicaoItem {
  alterado: boolean
  confirmarDescarte: boolean
  continuarEditando: () => void
  descartar: () => void
  permitido: boolean
  abrir: () => void
  fechar: () => void
  alterar: (campo: keyof UpdateItemRequest, valor: string) => void
  salvar: (evento: FormEvent) => Promise<void>
}

const CONDICOES: Record<string, UpdateItemRequest['condition']> = { novo: 'NEW', usado: 'USED', semidanificado: 'SEMI_DAMAGED', danificado: 'DAMAGED' }

function formulario(item: ProdutoDetalhado): UpdateItemRequest {
  return { name: item.nome, condition: CONDICOES[item.condicao] ?? 'USED', notes: '' }
}

export function useEdicaoItem(item: ProdutoDetalhado, aoConcluir: () => void): RetornoEdicaoItem {
  const { editarItem: permitido } = usePermissoes()
  const [estado, setEstado] = useState<EstadoEdicaoItem>({ aberto: false, form: formulario(item), erro: null, erros: {}, enviando: false, sucesso: '' })
  const montado = useRef(false)
  const emEnvio = useRef(false)
  const [confirmarDescarte, setConfirmarDescarte] = useState(false)
  const inicial = formulario(item)
  const alterado = estado.form.name !== inicial.name || estado.form.condition !== inicial.condition || estado.form.notes !== inicial.notes
  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])
  function abrir() { if (permitido) setEstado((atual) => ({ ...atual, form: formulario(item), erro: null, erros: {}, sucesso: '', aberto: true })) }
  function descartar() { setConfirmarDescarte(false); setEstado((atual) => ({ ...atual, aberto: false, form: formulario(item) })) }
  function fechar() { if (!emEnvio.current) { if (alterado) setConfirmarDescarte(true); else descartar() } }
  function alterar(campo: keyof UpdateItemRequest, valor: string) {
    if (campo === 'condition' && !['NEW', 'USED', 'SEMI_DAMAGED', 'DAMAGED'].includes(valor)) return
    setEstado((atual) => ({ ...atual, form: { ...atual.form, [campo]: valor }, erros: { ...atual.erros, [campo]: undefined } }))
  }
  async function salvar(evento: FormEvent): Promise<void> {
    evento.preventDefault()
    if (emEnvio.current || !permitido || !alterado) return
    const validacao = validarEdicaoItem(estado.form)
    if (!validacao.valido) { setEstado((atual) => ({ ...atual, erros: validacao.erros })); return }
    emEnvio.current = true
    setEstado((atual) => ({ ...atual, enviando: true, erro: null, erros: {}, sucesso: '' }))
    try {
      await editarItemReal(item.id, validacao.dados)
      if (!montado.current) return
      setEstado((atual) => ({ ...atual, aberto: false, sucesso: 'Item atualizado.' }))
      aoConcluir()
    } catch (falha: unknown) {
      if (montado.current) setEstado((atual) => ({ ...atual, erro: mensagemDeErro(falha) }))
    } finally {
      emEnvio.current = false
      if (montado.current) setEstado((atual) => ({ ...atual, enviando: false }))
    }
  }
  return { ...estado, alterado, confirmarDescarte, continuarEditando: () => setConfirmarDescarte(false), descartar, permitido, abrir, fechar, alterar, salvar }
}
