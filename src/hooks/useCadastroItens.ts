import type { FormEvent, SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { observarCatalogo } from '../services/catalogoEventos'
import { criarItemReal, removerItemReal } from '../services/itemCadastroService'
import { listarModelos } from '../services/modeloService'
import { mensagemDeErro } from '../types/api'
import type { CadastroItemReal, DanoItemReal } from '../types/cadastroItem'
import type { EstadoFormularioItem, FormItem, RetornoCadastroItens } from '../types/formularioItem'
import type { EstadoLocalCadastroItens } from '../types/controles/EstadoLocalCadastroItens'
import type { ProdutoDetalhado } from '../types/produto'
import { validarCadastroItemReal } from '../utils/validacaoItemReal'
import { usePermissoes } from './usePermissoes'
import { useRequisicao } from './useRequisicao'
import { useToast } from './useToast'

const FORM_INICIAL: FormItem = {
  nome: '', categoriaId: '', marca: '', condicao: '', modelId: '',
  usageIntensity: '', hasDamages: '', damages: '',
}
const ESTADO_INICIAL: EstadoFormularioItem = {
  modalAberto: false, form: FORM_INICIAL, formInicial: FORM_INICIAL,
  erros: {}, enviando: false, erroEnvio: null, confirmandoDescarte: false,
}
const CONDICOES: Record<string, CadastroItemReal['condition']> = {
  novo: 'NEW', usado: 'USED', semidanificado: 'SEMI_DAMAGED', danificado: 'DAMAGED',
}
const DANOS: DanoItemReal[] = ['BROKEN_SCREEN', 'MISSING_PART', 'DOES_NOT_POWER_ON', 'OXIDATION', 'OTHER']
const ERROS_POR_CAMPO: Record<keyof FormItem, string[]> = {
  nome: ['nome', 'name'], categoriaId: ['categoriaId'], marca: ['marca'],
  condicao: ['condicao', 'condition'], modelId: ['modelId'],
  usageIntensity: ['usageIntensity'], hasDamages: ['hasDamages', 'damages'], damages: ['damages'],
}

export function useCadastroItens(aoAtualizar: () => void): RetornoCadastroItens {
  const { cadastrarItem: podeCadastrar, excluirItem: podeExcluir } = usePermissoes()
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalCadastroItens>(() => ({
    criado: null,
    estado: ESTADO_INICIAL,
    exclusao: { excluindo: null, processandoExclusao: false, erroExclusao: null },
  }))
  const { criado, estado, exclusao } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setCriado, setEstado, setExclusao } = useMemo(() => ({
    setCriado: (valor: SetStateAction<EstadoLocalCadastroItens['criado']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.criado) : valor
      return Object.is(atual.criado, proximo) ? atual : { ...atual, criado: proximo }
    }),
    setEstado: (valor: SetStateAction<EstadoLocalCadastroItens['estado']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.estado) : valor
      return Object.is(atual.estado, proximo) ? atual : { ...atual, estado: proximo }
    }),
    setExclusao: (valor: SetStateAction<EstadoLocalCadastroItens['exclusao']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.exclusao) : valor
      return Object.is(atual.exclusao, proximo) ? atual : { ...atual, exclusao: proximo }
    }),
  }), [])
  const [toast, mostrarToast] = useToast()
  const montado = useRef(false)
  const salvando = useRef(false)
  const removendo = useRef(false)
  const restaurarFoco = useRef(false)
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscarModelos = useCallback((sinal: AbortSignal) => listarModelos(sinal), [])
  const modelos = useRequisicao(buscarModelos)
  useEffect(() => observarCatalogo(modelos.recarregar), [modelos.recarregar])

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  useEffect(() => {
    if (exclusao.excluindo || !restaurarFoco.current) return
    restaurarFoco.current = false
    const quadro = requestAnimationFrame(() => document.getElementById('adicionar-item')?.focus())
    return () => cancelAnimationFrame(quadro)
  }, [exclusao.excluindo])

  // Mantém a ação estável para os consumidores e efeitos que a recebem.
  const abrirCadastro = useCallback(() => { if (podeCadastrar) setEstado({ ...ESTADO_INICIAL, modalAberto: true }) }, [podeCadastrar, setEstado])
  // Mantém a ação estável para os consumidores e efeitos que a recebem.
  const setForm = useCallback((atualizar: SetStateAction<FormItem>) => {
    if (salvando.current) return
    setEstado((atual) => {
      const form = typeof atualizar === 'function' ? atualizar(atual.form) : atualizar
      const camposAlterados = (Object.keys(form) as (keyof FormItem)[]).filter((campo) => form[campo] !== atual.form[campo])
      const errosRemovidos = new Set(camposAlterados.flatMap((campo) => ERROS_POR_CAMPO[campo]))
      const erros = Object.fromEntries(Object.entries(atual.erros).filter(([campo]) => !errosRemovidos.has(campo)))
      return { ...atual, form, erros, erroEnvio: camposAlterados.length > 0 ? null : atual.erroEnvio }
    })
  }, [setEstado])
  // Mantém a ação estável para os consumidores e efeitos que a recebem.
  const setModalAberto = useCallback((aberto: boolean) => {
    if (!salvando.current) setEstado((atual) => ({ ...atual, modalAberto: aberto, confirmandoDescarte: false }))
  }, [setEstado])
  // Mantém a ação estável para os consumidores e efeitos que a recebem.
  const setConfirmandoDescarte = useCallback((confirmando: boolean) => {
    setEstado((atual) => ({ ...atual, confirmandoDescarte: confirmando }))
  }, [setEstado])
  // Mantém a ação estável para os consumidores e efeitos que a recebem.
  const setExcluindo = useCallback((item: ProdutoDetalhado | null) => {
    if (item && !podeExcluir) return
    if (!removendo.current) setExclusao({ excluindo: item, processandoExclusao: false, erroExclusao: null })
  }, [podeExcluir, setExclusao])
  const formularioSujo = (Object.keys(estado.form) as (keyof FormItem)[]).some((campo) => estado.form[campo] !== estado.formInicial[campo])
  function tentarFecharModal() {
    if (salvando.current) return
    if (formularioSujo && !estado.confirmandoDescarte) {
      setConfirmandoDescarte(true)
      return
    }
    setModalAberto(false)
  }

  async function aoSalvar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    if (salvando.current || !podeCadastrar) return
    const { form } = estado
    const dano = DANOS.find((opcao) => opcao === form.damages)
    const validacao = validarCadastroItemReal({
      name: form.nome, barcode: crypto.randomUUID(), modelId: form.modelId,
      condition: CONDICOES[form.condicao],
      usageIntensity: form.usageIntensity === '' ? Number.NaN : Number(form.usageIntensity),
      hasDamages: form.hasDamages === 'sim' ? true : form.hasDamages === 'nao' ? false : null,
      damages: form.hasDamages === 'sim' && dano ? [dano] : [],
    })
    setEstado((atual) => ({ ...atual, erroEnvio: null, erros: validacao.erros }))
    if (!validacao.valido) {
      const ids: Record<string, string> = {
        nome: 'item-nome', name: 'item-nome', categoriaId: 'item-material', marca: 'item-marca',
        modelId: 'item-modelo', condicao: 'item-condicao', condition: 'item-condicao',
        usageIntensity: 'item-intensidade', hasDamages: 'item-tem-danos', damages: 'item-danos',
      }
      document.getElementById(ids[Object.keys(validacao.erros)[0]])?.focus()
      return
    }
    salvando.current = true
    setEstado((atual) => ({ ...atual, enviando: true }))
    try {
      const criado = await criarItemReal(validacao.dados)
      if (!montado.current) return
      mostrarToast('Item cadastrado como rascunho. Acompanhe a aprovação nos detalhes.')
      setEstado((atual) => ({ ...atual, modalAberto: false }))
      aoAtualizar()
      setCriado(criado)
    } catch (falha: unknown) {
      if (montado.current) setEstado((atual) => ({ ...atual, erroEnvio: mensagemDeErro(falha) }))
    } finally {
      salvando.current = false
      if (montado.current) setEstado((atual) => ({ ...atual, enviando: false }))
    }
  }

  async function aoConfirmarExclusao(): Promise<void> {
    if (!exclusao.excluindo || removendo.current || !podeExcluir) return
    const item = exclusao.excluindo
    removendo.current = true
    setExclusao((atual) => ({ ...atual, processandoExclusao: true, erroExclusao: null }))
    try {
      await removerItemReal(item.id)
      if (!montado.current) return
      mostrarToast(`"${item.nome}" removido do inventário.`)
      setExclusao((atual) => ({ ...atual, excluindo: null }))
      restaurarFoco.current = true
      aoAtualizar()
    } catch (falha: unknown) {
      if (montado.current) setExclusao((atual) => ({ ...atual, erroExclusao: mensagemDeErro(falha) }))
    } finally {
      removendo.current = false
      if (montado.current) setExclusao((atual) => ({ ...atual, processandoExclusao: false }))
    }
  }

  return {
    ...estado, ...exclusao, criado, limparSucesso: () => setCriado(null), modelos, toast, formularioSujo, podeCadastrar, podeExcluir,
    abrirCadastro, setForm, setModalAberto, setConfirmandoDescarte,
    setExcluindo, tentarFecharModal, aoSalvar, aoConfirmarExclusao,
  }
}
