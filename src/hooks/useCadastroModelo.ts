import type { FormEvent } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { criarModeloReal, listarMateriais } from '../services/cadastroModeloService'
import { invalidarCatalogo, observarCatalogo } from '../services/catalogoEventos'
import { listarModelos } from '../services/modeloService'
import { mensagemDeErro } from '../types/api'
import type { CodigoMaterial } from '../types/cadastroModelo'
import type { EstadoCadastroModelo, FormModelo, RetornoCadastroModelo } from '../types/formularioModelo'
import type { Modelo } from '../types/modelo'
import { validarCadastroModeloReal } from '../utils/validacaoCadastroModelo'
import { usePermissoes } from './usePermissoes'
import { useRequisicao } from './useRequisicao'
import { useToast } from './useToast'

const FORM_INICIAL: FormModelo = {
  nome: '', fabricante: '', categoriaId: '', vidaUtilMeses: '',
  materiais: [], garantiaMeses: '', pesoEstimadoKg: '', observacoes: '', outroMaterial: '',
}
const ERROS_POR_CAMPO: Record<keyof FormModelo, string[]> = {
  nome: ['nome', 'name'], fabricante: ['fabricante', 'manufacturer'], categoriaId: ['categoriaId', 'categoryId'],
  vidaUtilMeses: ['vidaUtilMeses', 'expectedLifespanMonths'], materiais: ['materials'],
  garantiaMeses: ['warrantyMonths'], pesoEstimadoKg: ['estimatedWeightKg'], observacoes: ['notes'],
  outroMaterial: ['outroMaterial', 'notes'],
}

export function useCadastroModelo(aoConcluir?: (modelo: Modelo) => void): RetornoCadastroModelo {
  const { cadastrarModelo: permitido } = usePermissoes()
  const [estado, setEstado] = useState<EstadoCadastroModelo>({ modalAberto: false, form: FORM_INICIAL, erros: {}, enviando: false, erroEnvio: null })
  const [toast, mostrarToast] = useToast()
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscarModelos = useCallback((sinal: AbortSignal) => listarModelos(sinal), [])
  const modelos = useRequisicao(buscarModelos)
  useEffect(() => observarCatalogo(modelos.recarregar), [modelos.recarregar])
  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscarMateriais = useCallback((sinal: AbortSignal) => listarMateriais(sinal), [])
  const materiais = useRequisicao(buscarMateriais)
  const montado = useRef(false)
  const enviando = useRef(false)
  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  function abrir() {
    if (permitido) setEstado({ modalAberto: true, form: FORM_INICIAL, erros: {}, enviando: false, erroEnvio: null })
  }
  function fechar() {
    if (!enviando.current) setEstado((atual) => ({ ...atual, modalAberto: false }))
  }
  function alterar(campo: Exclude<keyof FormModelo, 'materiais'>, valor: string) {
    if (enviando.current) return
    setEstado((atual) => ({ ...atual, form: { ...atual.form, [campo]: valor }, erroEnvio: null,
      erros: Object.fromEntries(Object.entries(atual.erros).filter(([chave]) => !ERROS_POR_CAMPO[campo].includes(chave))),
    }))
  }
  function alternarMaterial(codigo: CodigoMaterial) {
    if (enviando.current || !materiais.dados?.some((material) => material.code === codigo)) return
    setEstado((atual) => ({ ...atual,
      form: { ...atual.form, materiais: atual.form.materiais.includes(codigo) ? atual.form.materiais.filter((material) => material !== codigo) : [...atual.form.materiais, codigo] },
      erros: { ...atual.erros, materials: undefined }, erroEnvio: null,
    }))
  }
  async function aoSalvar(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault()
    if (!permitido || enviando.current) return
    const { form } = estado
    const validacao = validarCadastroModeloReal({
      name: form.nome, manufacturer: form.fabricante, categoryId: form.categoriaId,
      materials: form.materiais,
      notes: [form.materiais.includes('OTHER') && form.outroMaterial.trim() ? `Outro material: ${form.outroMaterial.trim()}` : '', form.observacoes].filter(Boolean).join('\n') || undefined,
      warrantyMonths: form.garantiaMeses === '' ? undefined : Number(form.garantiaMeses),
      expectedLifespanMonths: form.vidaUtilMeses === '' ? undefined : Number(form.vidaUtilMeses),
      estimatedWeightKg: form.pesoEstimadoKg === '' ? undefined : Number(form.pesoEstimadoKg),
    })
    if (form.materiais.includes('OTHER') && !form.outroMaterial.trim()) {
      setEstado((atual) => ({ ...atual, erros: { ...validacao.erros, outroMaterial: 'Descreva o outro material.' } }))
      document.getElementById('modelo-outro-material')?.focus()
      return
    }
    setEstado((atual) => ({ ...atual, erros: validacao.erros, erroEnvio: null }))
    if (!validacao.valido) {
      const ids: Record<string, string> = {
        nome: 'modelo-nome', name: 'modelo-nome', fabricante: 'modelo-fabricante', manufacturer: 'modelo-fabricante',
        categoriaId: 'modelo-categoria', categoryId: 'modelo-categoria', vidaUtilMeses: 'modelo-vida-util', expectedLifespanMonths: 'modelo-vida-util',
        materials: 'modelo-materiais', notes: 'modelo-observacoes', warrantyMonths: 'modelo-garantia', estimatedWeightKg: 'modelo-peso',
      }
      document.getElementById(ids[Object.keys(validacao.erros)[0]])?.focus()
      return
    }
    enviando.current = true
    setEstado((atual) => ({ ...atual, enviando: true }))
    try {
      const criado = await criarModeloReal(validacao.dados)
      invalidarCatalogo()
      aoConcluir?.(criado)
      if (!montado.current) return
      mostrarToast(`Modelo "${form.nome.trim()}" cadastrado.`)
      setEstado((atual) => ({ ...atual, modalAberto: false, form: FORM_INICIAL }))
      modelos.recarregar()
    } catch (erro: unknown) {
      if (montado.current) setEstado((atual) => ({ ...atual, erroEnvio: mensagemDeErro(erro) }))
    } finally {
      enviando.current = false
      if (montado.current) setEstado((atual) => ({ ...atual, enviando: false }))
    }
  }
  return { ...estado, permitido, modelos, materiais, toast, abrir, fechar, alterar, alternarMaterial, aoSalvar }
}
