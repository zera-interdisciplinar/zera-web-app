import type { FormEvent } from 'react'
import type { CadastroModeloReal, CodigoMaterial, MaterialCatalogo } from './cadastroModelo'
import type { Modelo, NovoModelo } from './modelo'
import type { EstadoRequisicao } from '../hooks/useRequisicao'
import type { ErrosDeCampo } from '../utils/validacao'

export interface FormModelo {
  nome: string
  fabricante: string
  categoriaId: string
  vidaUtilMeses: string
  especificacoes: string
  materiais: CodigoMaterial[]
  garantiaMeses: string
  pesoEstimadoKg: string
  observacoes: string
  outroMaterial: string
}

export interface EstadoCadastroModelo {
  modalAberto: boolean
  form: FormModelo
  erros: ErrosDeCampo<NovoModelo> & ErrosDeCampo<CadastroModeloReal> & { outroMaterial?: string }
  enviando: boolean
  erroEnvio: string | null
}

export interface RetornoCadastroModelo extends EstadoCadastroModelo {
  permitido: boolean
  modoDemonstracao: boolean
  modelos: EstadoRequisicao<Modelo[]>
  materiais: EstadoRequisicao<MaterialCatalogo[]>
  toast: string | null
  abrir: () => void
  fechar: () => void
  alterar: (campo: Exclude<keyof FormModelo, 'materiais'>, valor: string) => void
  alternarMaterial: (codigo: CodigoMaterial) => void
  aoSalvar: (evento: FormEvent<HTMLFormElement>) => Promise<void>
}
