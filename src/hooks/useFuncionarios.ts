import type { SetStateAction } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { criarUsuario, listarUsuarios } from '../services/usuarioService'
import { mensagemDeErro } from '../types/api'
import type { EstadoLocalFuncionarios } from '../types/controles/EstadoLocalFuncionarios'
import type { NovoUsuario, Perfil, Usuario } from '../types/usuario'
import { ROTULO_PERFIL } from '../types/usuario'
import { validarNovoUsuario } from '../utils/validacao'
import { useRequisicao } from './useRequisicao'
import { useToast } from './useToast'

interface FormFuncionario {
  nome: string
  email: string
  perfil: string
  unidade: string
}
const FORM_INICIAL: FormFuncionario = { nome: '', email: '', perfil: '', unidade: '' }

export function useFuncionarios() {

  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscar = useCallback((sinal: AbortSignal) => listarUsuarios(sinal), [])
  const usuarios = useRequisicao<Usuario[]>(buscar)
  const [toast, mostrarToast] = useToast()
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalFuncionarios>(() => ({
    busca: '',
    modalAberto: false,
    form: FORM_INICIAL,
    erros: {},
    enviando: false,
    erroEnvio: null,
  }))
  const { busca, modalAberto, form, erros, enviando, erroEnvio } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setBusca, setModalAberto, setForm, setErros, setEnviando, setErroEnvio } = useMemo(() => ({
    setBusca: (valor: SetStateAction<EstadoLocalFuncionarios['busca']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.busca) : valor
      return Object.is(atual.busca, proximo) ? atual : { ...atual, busca: proximo }
    }),
    setModalAberto: (valor: SetStateAction<EstadoLocalFuncionarios['modalAberto']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.modalAberto) : valor
      return Object.is(atual.modalAberto, proximo) ? atual : { ...atual, modalAberto: proximo }
    }),
    setForm: (valor: SetStateAction<EstadoLocalFuncionarios['form']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.form) : valor
      return Object.is(atual.form, proximo) ? atual : { ...atual, form: proximo }
    }),
    setErros: (valor: SetStateAction<EstadoLocalFuncionarios['erros']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erros) : valor
      return Object.is(atual.erros, proximo) ? atual : { ...atual, erros: proximo }
    }),
    setEnviando: (valor: SetStateAction<EstadoLocalFuncionarios['enviando']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.enviando) : valor
      return Object.is(atual.enviando, proximo) ? atual : { ...atual, enviando: proximo }
    }),
    setErroEnvio: (valor: SetStateAction<EstadoLocalFuncionarios['erroEnvio']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erroEnvio) : valor
      return Object.is(atual.erroEnvio, proximo) ? atual : { ...atual, erroEnvio: proximo }
    }),
  }), [])

  // Filtra novamente apenas quando os dados ou o termo de busca mudam.
  const visiveis = useMemo<Usuario[]>(() => {
    const dados = usuarios.dados ?? []
    const termo = busca.trim().toLowerCase()
    if (termo.length === 0) return dados
    return dados.filter(
      (pessoa) =>
        pessoa.nome.toLowerCase().includes(termo) ||
        pessoa.email.toLowerCase().includes(termo) ||
        pessoa.unidade.toLowerCase().includes(termo),
    )
  }, [usuarios.dados, busca])

  async function aoSalvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setErroEnvio(null)

    const candidato: NovoUsuario = {
      nome: form.nome,
      email: form.email,
      perfil: form.perfil as Perfil,
      unidade: form.unidade,
    }

    const validacao = validarNovoUsuario(candidato)
    setErros(validacao.erros)
    if (!validacao.valido) return

    setEnviando(true)
    try {
      await criarUsuario(validacao.dados)
      mostrarToast(`${validacao.dados.nome} cadastrado como ${ROTULO_PERFIL[validacao.dados.perfil].toLowerCase()}.`)
      setModalAberto(false)
      setForm(FORM_INICIAL)
      usuarios.recarregar()
    } catch (falha) {
      setErroEnvio(mensagemDeErro(falha))
    } finally {
      setEnviando(false)
    }
  }
  return {
    usuarios,
    toast,
    busca,
    setBusca,
    modalAberto,
    setModalAberto,
    form,
    setForm,
    erros,
    setErros,
    enviando,
    erroEnvio,
    visiveis,
    aoSalvar,
  }
}
