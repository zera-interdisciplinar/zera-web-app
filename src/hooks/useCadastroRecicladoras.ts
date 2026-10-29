import type { SetStateAction } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { modoDemonstracao } from '../services/apiReal'
import { criarRecicladora, listarRecicladoras } from '../services/relatorioService'
import { mensagemDeErro } from '../types/api'
import type { EstadoLocalCadastroRecicladoras } from '../types/controles/EstadoLocalCadastroRecicladoras'
import type { NovaRecicladora, Recicladora } from '../types/relatorio'
import { normalizarBusca } from '../utils/busca'
import { validarNovaRecicladora } from '../utils/validacao'
import { usePermissoes } from './usePermissoes'
import { useRequisicao } from './useRequisicao'
import { useToast } from './useToast'

const FORM_INICIAL: NovaRecicladora = { nome: '', cnpj: '', cidade: '', email: '' }

export function useCadastroRecicladoras() {
  const { gerirEstoque } = usePermissoes()

  // A referência estável evita reabrir a consulta em useRequisicao.
  const buscar = useCallback((sinal: AbortSignal) => listarRecicladoras(sinal), [])
  const recicladoras = useRequisicao<Recicladora[]>(buscar)
  const [toast, mostrarToast] = useToast()
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalCadastroRecicladoras>(() => ({
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
    setBusca: (valor: SetStateAction<EstadoLocalCadastroRecicladoras['busca']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.busca) : valor
      return Object.is(atual.busca, proximo) ? atual : { ...atual, busca: proximo }
    }),
    setModalAberto: (valor: SetStateAction<EstadoLocalCadastroRecicladoras['modalAberto']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.modalAberto) : valor
      return Object.is(atual.modalAberto, proximo) ? atual : { ...atual, modalAberto: proximo }
    }),
    setForm: (valor: SetStateAction<EstadoLocalCadastroRecicladoras['form']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.form) : valor
      return Object.is(atual.form, proximo) ? atual : { ...atual, form: proximo }
    }),
    setErros: (valor: SetStateAction<EstadoLocalCadastroRecicladoras['erros']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erros) : valor
      return Object.is(atual.erros, proximo) ? atual : { ...atual, erros: proximo }
    }),
    setEnviando: (valor: SetStateAction<EstadoLocalCadastroRecicladoras['enviando']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.enviando) : valor
      return Object.is(atual.enviando, proximo) ? atual : { ...atual, enviando: proximo }
    }),
    setErroEnvio: (valor: SetStateAction<EstadoLocalCadastroRecicladoras['erroEnvio']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erroEnvio) : valor
      return Object.is(atual.erroEnvio, proximo) ? atual : { ...atual, erroEnvio: proximo }
    }),
  }), [])

  // Filtra novamente apenas quando os dados ou o termo de busca mudam.
  const visiveis = useMemo<Recicladora[]>(() => {
    const dados = recicladoras.dados ?? []
    const termo = normalizarBusca(busca)
    if (termo.length === 0) return dados
    return dados.filter(
      (recicladora) =>
        normalizarBusca(recicladora.nome).includes(termo) ||
        normalizarBusca(recicladora.email ?? recicladora.cidade).includes(termo) ||
        recicladora.cnpj.includes(termo),
    )
  }, [recicladoras.dados, busca])

  async function aoSalvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando || !gerirEstoque) return
    setErroEnvio(null)

    const validacao = validarNovaRecicladora(form, !modoDemonstracao)
    setErros(validacao.erros)
    if (!validacao.valido) return

    setEnviando(true)
    try {
      await criarRecicladora(validacao.dados)
      mostrarToast(`Cooperativa "${validacao.dados.nome}" cadastrada.`)
      setModalAberto(false)
      setForm(FORM_INICIAL)
      recicladoras.recarregar()
    } catch (falha) {
      setErroEnvio(mensagemDeErro(falha))
    } finally {
      setEnviando(false)
    }
  }
  return {
    gerirEstoque,
    recicladoras,
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
