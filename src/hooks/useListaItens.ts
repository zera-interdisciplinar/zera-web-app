import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { FiltroItens, ProdutoDetalhado, StatusItem } from '../types/produto'
import { ROTULO_STATUS } from '../types/produto'
import { normalizarBusca } from '../utils/busca'
import { useAuth } from './useAuth'
import { useCadastroCategoria } from './useCadastroCategoria'
import { useCadastroItens } from './useCadastroItens'
import { useCadastroModelo } from './useCadastroModelo'
import { useCategorias } from './useCategorias'
import { usePermissoes } from './usePermissoes'
import { useProdutos } from './useProdutos'

const STATUS_OPCOES = (Object.keys(ROTULO_STATUS) as StatusItem[]).map((valor) => ({
  valor,
  rotulo: ROTULO_STATUS[valor],
}))

export function useListaItens() {
  const { usuario } = useAuth()
  const permissoes = usePermissoes()
  const produtos = useProdutos()
  const categorias = useCategorias()
  const [parametros, setParametros] = useSearchParams()
  const {
    modelos, modoDemonstracao, criado, limparSucesso,
    modalAberto, editando, form, setForm, erros, enviando, erroEnvio,
    confirmandoDescarte, setConfirmandoDescarte, excluindo, setExcluindo,
    processandoExclusao, erroExclusao, abrirCadastro, abrirEdicao, tentarFecharModal,
    aoSalvar, aoConfirmarExclusao, setModalAberto, toast,
    podeCadastrar, podeExcluir,
  } = useCadastroItens(produtos.recarregar)
  const sucessoRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => { if (criado) sucessoRef.current?.focus() }, [criado])
  const categoriaRapida = useCadastroCategoria((categoria) => setForm((atual) => ({ ...atual, categoriaId: String(categoria.id), modelId: '' })))
  const modeloRapido = useCadastroModelo((modelo) => setForm((atual) => ({ ...atual, categoriaId: String(modelo.categoriaId), modelId: String(modelo.id) })))
  const categoriaDaUrl = parametros.get('categoria')
  const responsavelDaUrl = parametros.get('responsavel')
  const periodoDaUrl = parametros.get('periodo')

  // Evita recalcular o valor enquanto suas dependências permanecem iguais.
  const filtro = useMemo<FiltroItens>(() => ({
    busca: parametros.get('q') ?? '',
    status: STATUS_OPCOES.find((opcao) => opcao.valor === parametros.get('status'))?.valor ?? 'todos',
  }), [parametros])

  function setFiltro(atualizar: FiltroItens | ((atual: FiltroItens) => FiltroItens)) {
    const proximo = typeof atualizar === 'function' ? atualizar(filtro) : atualizar
    setParametros((atuais) => {
      const novos = new URLSearchParams(atuais)
      if (proximo.busca) novos.set('q', proximo.busca); else novos.delete('q')
      if (proximo.status !== 'todos') novos.set('status', proximo.status); else novos.delete('status')
      return novos
    }, { replace: true })
  }
  const filtrosSujos = filtro.busca.trim() !== '' || filtro.status !== 'todos' || Boolean(categoriaDaUrl || responsavelDaUrl || periodoDaUrl)

  function limparFiltros() { setParametros({}) }

  // Filtra novamente apenas quando os dados ou o termo de busca mudam.
  const visiveis = useMemo<ProdutoDetalhado[]>(() => {
    const dados = produtos.dados ?? []
    const termo = normalizarBusca(filtro.busca)

    return dados.filter((produto) => {
      if (categoriaDaUrl && String(produto.categoriaId) !== categoriaDaUrl) return false
      if (responsavelDaUrl && produto.responsavel !== responsavelDaUrl) return false
      const meses = periodoDaUrl === 'últimos 3 meses' ? 3 : periodoDaUrl === 'últimos 6 meses' ? 6 : periodoDaUrl === 'último ano' ? 12 : null
      if (meses !== null) {
        const limite = new Date()
        limite.setMonth(limite.getMonth() - meses)
        if (Date.parse(produto.atualizacao) < limite.getTime()) return false
      }
      if (filtro.status !== 'todos' && produto.status !== filtro.status) return false
      if (termo.length === 0) return true
      return (
        normalizarBusca(produto.nome).includes(termo) ||
        normalizarBusca(produto.marca).includes(termo) ||
        normalizarBusca(produto.categoriaNome).includes(termo)
      )
    })
  }, [produtos.dados, filtro, categoriaDaUrl, responsavelDaUrl, periodoDaUrl])
  return {
    usuario,
    permissoes,
    produtos,
    categorias,
    modelos,
    modoDemonstracao,
    criado,
    limparSucesso,
    modalAberto,
    editando,
    form,
    setForm,
    erros,
    enviando,
    erroEnvio,
    confirmandoDescarte,
    setConfirmandoDescarte,
    excluindo,
    setExcluindo,
    processandoExclusao,
    erroExclusao,
    abrirCadastro,
    abrirEdicao,
    tentarFecharModal,
    aoSalvar,
    aoConfirmarExclusao,
    setModalAberto,
    toast,
    podeCadastrar,
    podeExcluir,
    sucessoRef,
    categoriaRapida,
    modeloRapido,
    filtro,
    setFiltro,
    filtrosSujos,
    limparFiltros,
    visiveis,
  }
}
