import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { CadastroItemReal } from './cadastroItem'
import type { Modelo } from './modelo'
import type { ProdutoDetalhado } from './produto'
import type { EstadoRequisicao } from '../hooks/useRequisicao'
import type { ErrosDeCampo } from '../utils/validacao'

export interface FormItem {
  nome: string
  categoriaId: string
  marca: string
  condicao: string
  modelId: string
  usageIntensity: string
  hasDamages: string
  damages: string
}

export interface EstadoFormularioItem {
  modalAberto: boolean
  form: FormItem
  formInicial: FormItem
  erros: ErrosDeCampo<CadastroItemReal>
  enviando: boolean
  erroEnvio: string | null
  confirmandoDescarte: boolean
}

export interface EstadoExclusaoItem {
  excluindo: ProdutoDetalhado | null
  processandoExclusao: boolean
  erroExclusao: string | null
}

export interface RetornoCadastroItens extends EstadoFormularioItem, EstadoExclusaoItem {
  criado: ProdutoDetalhado | null
  limparSucesso: () => void
  podeCadastrar: boolean
  podeExcluir: boolean
  modelos: EstadoRequisicao<Modelo[]>
  toast: string | null
  formularioSujo: boolean
  abrirCadastro: () => void
  setForm: Dispatch<SetStateAction<FormItem>>
  setModalAberto: (aberto: boolean) => void
  setConfirmandoDescarte: (confirmando: boolean) => void
  setExcluindo: (item: ProdutoDetalhado | null) => void
  tentarFecharModal: () => void
  aoSalvar: (evento: FormEvent<HTMLFormElement>) => Promise<void>
  aoConfirmarExclusao: () => Promise<void>
}
