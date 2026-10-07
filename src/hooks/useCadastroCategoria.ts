import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from './useAuth'
import { criarCategoria } from '../services/categoriaService'
import { mensagemDeErro } from '../types/api'
import type { NovaCategoria } from '../types/categoria'
import type { ErrosDeCampo } from '../utils/validacao'
import { validarCategoria } from '../utils/validacaoInventario'

interface EstadoCadastroCategoria {
  aberto: boolean
  form: { nome: string; descricao: string }
  enviando: boolean
  erro: string | null
  erros: ErrosDeCampo<NovaCategoria>
  sucesso: string
}

interface RetornoCadastroCategoria extends EstadoCadastroCategoria {
  permitido: boolean
  abrir: () => void
  fechar: () => void
  alterar: (campo: 'nome' | 'descricao', valor: string) => void
  salvar: (evento: FormEvent) => Promise<void>
}

export function useCadastroCategoria(aoConcluir: () => void): RetornoCadastroCategoria {
  const { temPerfil } = useAuth()
  const [estado, setEstado] = useState<EstadoCadastroCategoria>({ aberto: false, form: { nome: '', descricao: '' }, enviando: false, erro: null, erros: {}, sucesso: '' })
  const montado = useRef(false)
  const emEnvio = useRef(false)
  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  function abrir() { setEstado((atual) => ({ ...atual, aberto: true, erro: null, erros: {}, sucesso: '' })) }
  function fechar() { if (!emEnvio.current) setEstado((atual) => ({ ...atual, aberto: false })) }
  function alterar(campo: 'nome' | 'descricao', valor: string) {
    setEstado((atual) => ({ ...atual, form: { ...atual.form, [campo]: valor }, erros: { ...atual.erros, [campo]: undefined } }))
  }
  async function salvar(evento: FormEvent): Promise<void> {
    evento.preventDefault()
    if (emEnvio.current) return
    const validacao = validarCategoria({ ...estado.form, diasLimiteDescarte: 90, exigeChecklistPericulosidade: false })
    if (!validacao.valido) { setEstado((atual) => ({ ...atual, erros: validacao.erros })); return }
    emEnvio.current = true
    setEstado((atual) => ({ ...atual, enviando: true, erro: null, erros: {}, sucesso: '' }))
    try {
      await criarCategoria(validacao.dados)
      if (!montado.current) return
      setEstado((atual) => ({ ...atual, aberto: false, form: { nome: '', descricao: '' }, sucesso: `Categoria ${validacao.dados.nome} cadastrada.` }))
      aoConcluir()
    } catch (falha: unknown) {
      if (montado.current) setEstado((atual) => ({ ...atual, erro: mensagemDeErro(falha) }))
    } finally {
      emEnvio.current = false
      if (montado.current) setEstado((atual) => ({ ...atual, enviando: false }))
    }
  }
  return { ...estado, permitido: temPerfil(['gestor', 'administrador']), abrir, fechar, alterar, salvar }
}
