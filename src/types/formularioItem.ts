import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { CadastroItemReal } from './cadastroItem'
import type { Modelo } from './modelo'
import type { FiltroItens, NovoProduto, ProdutoDetalhado } from './produto'
import type { EstadoRequisicao } from '../hooks/useRequisicao'
import type { ErrosDeCampo } from '../utils/validacao'

export interface FormItem {
  nome: string
  categoriaId: string
  marca: string
  condicao: string
  barcode: string
  modelId: string
  usageIntensity: string
  hasDamages: string
  damages: string
}

export interface EstadoFormularioItem {
  modalAberto: boolean
  editando: ProdutoDetalhado | null
  form: FormItem
  formInicial: FormItem
  erros: ErrosDeCampo<NovoProduto> & ErrosDeCampo<CadastroItemReal>
  enviando: boolean
  erroEnvio: string | null
  confirmandoDescarte: boolean
}

export interface EstadoExclusaoItem {
  excluindo: ProdutoDetalhado | null
  processandoExclusao: boolean
  erroExclusao: string | null
}

export interface EstadoEtiqueta {
  codigo: string
  buscandoCodigo: boolean
  erroCodigo: string | null
}

export interface EstadoFiltrosItens {
  filtro: FiltroItens
  ultimoParametro: string
}

export interface RetornoCadastroItens extends EstadoFormularioItem, EstadoExclusaoItem, EstadoEtiqueta {
  modoDemonstracao: boolean
  modelos: EstadoRequisicao<Modelo[]>
  toast: string | null
  formularioSujo: boolean
  abrirCadastro: () => void
  abrirEdicao: (item: ProdutoDetalhado) => void
  setForm: Dispatch<SetStateAction<FormItem>>
  setCodigo: (codigo: string) => void
  setModalAberto: (aberto: boolean) => void
  setConfirmandoDescarte: (confirmando: boolean) => void
  setExcluindo: (item: ProdutoDetalhado | null) => void
  tentarFecharModal: () => void
  aoSalvar: (evento: FormEvent<HTMLFormElement>) => Promise<void>
  aoConfirmarExclusao: () => Promise<void>
  localizarCodigo: (evento: FormEvent) => Promise<void>
}
