import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { listarItensElegiveisDescarte, registrarDescarte } from '../services/descarteService'
import { validarNovoDescarte } from '../utils/validacaoDescarte'
import { mensagemDeErro } from '../types/api'
import type { LocalReciclagem, NovoDescarte } from '../types/descarte'
import type { EstadoRegistroDescarte, RetornoRegistroDescarte } from '../types/registroDescarte'
import { useRequisicao } from './useRequisicao'
import { useAuth } from './useAuth'

function dataHoje(): string {
  const data = new Date()
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`
}

function novoFormulario(): NovoDescarte { return { destination: 'RECYCLING', itemIds: [], disposedAt: dataHoje(), notes: '' } }

export function useRegistroDescarte(aoConcluir: () => void): RetornoRegistroDescarte {
  const { temPerfil } = useAuth()
  const permitido = temPerfil(['gestor', 'funcionario'])
  const buscar = useCallback((sinal: AbortSignal) => listarItensElegiveisDescarte(sinal), [])
  const itens = useRequisicao(buscar, permitido)
  const [estado, setEstado] = useState<EstadoRegistroDescarte>({ form: novoFormulario(), erros: {}, enviando: false, erro: null, sucesso: '' })
  const montado = useRef(false)
  const emEnvio = useRef(false)
  useEffect(() => { montado.current = true; return () => { montado.current = false } }, [])
  useEffect(() => { if (estado.form.placeId) document.getElementById('descarte-local-selecionado')?.focus() }, [estado.form.placeId])
  useEffect(() => { if (estado.sucesso) document.getElementById('descarte-sucesso')?.focus() }, [estado.sucesso])
  function alterar(campo: 'destination' | 'disposedAt' | 'notes' | 'placeName', valor: string) {
    if (emEnvio.current || (campo === 'destination' && !['RECYCLING', 'LANDFILL', 'DONATION'].includes(valor))) return
    setEstado((atual) => ({
      ...atual,
      form: { ...atual.form, [campo]: valor, ...(campo === 'destination' ? { placeId: undefined, placeName: undefined } : {}) },
      erros: { ...atual.erros, [campo]: undefined }, erro: null, sucesso: '',
    }))
  }
  function alternarItem(id: string) {
    if (emEnvio.current) return
    setEstado((atual) => ({ ...atual, form: { ...atual.form, itemIds: atual.form.itemIds.includes(id) ? atual.form.itemIds.filter((item) => item !== id) : [...atual.form.itemIds, id] }, erros: { ...atual.erros, itemIds: undefined }, erro: null, sucesso: '' }))
  }
  function selecionarLocal(local: LocalReciclagem) {
    if (!emEnvio.current) setEstado((atual) => ({ ...atual, form: { ...atual.form, placeId: local.placeId, placeName: local.name }, erros: { ...atual.erros, placeId: undefined, placeName: undefined }, sucesso: '' }))
  }
  function removerLocal() {
    if (!emEnvio.current) setEstado((atual) => ({ ...atual, form: { ...atual.form, placeId: undefined, placeName: undefined } }))
  }
  async function salvar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    if (emEnvio.current || !permitido) return
    const validacao = validarNovoDescarte(estado.form)
    setEstado((atual) => ({ ...atual, erros: validacao.erros, erro: null, sucesso: '' }))
    if (!validacao.valido) {
      document.getElementById(`descarte-${Object.keys(validacao.erros)[0]}`)?.focus()
      return
    }
    if (!itens.dados || validacao.dados.itemIds.some((id) => !itens.dados?.some((item) => String(item.id) === id))) {
      setEstado((atual) => ({ ...atual, erro: 'A lista de itens mudou. Atualize os itens disponíveis e confira a seleção.' }))
      return
    }
    emEnvio.current = true
    setEstado((atual) => ({ ...atual, enviando: true }))
    try {
      const registro = await registrarDescarte(validacao.dados)
      if (!montado.current) return
      const quantidade = validacao.dados.itemIds.length
      setEstado((atual) => ({ ...atual, form: novoFormulario(), sucesso: `Descarte registrado com ${quantidade} ${quantidade === 1 ? 'item' : 'itens'}. Registro ${registro.id}.` }))
      itens.recarregar()
      aoConcluir()
    } catch (erro: unknown) {
      if (montado.current) setEstado((atual) => ({ ...atual, erro: mensagemDeErro(erro) }))
    } finally {
      emEnvio.current = false
      if (montado.current) setEstado((atual) => ({ ...atual, enviando: false }))
    }
  }
  return { ...estado, itens, permitido, hoje: dataHoje(), alterar, alternarItem, selecionarLocal, removerLocal, salvar }
}
