import type { FormEvent } from 'react'
import type { ErrosDeCampo } from '../../utils/validacao'
import type { UpdateItemRequest } from '../apiReal'

export interface EstadoEdicaoItem {
  aberto: boolean
  form: UpdateItemRequest
  erro: string | null
  erros: ErrosDeCampo<UpdateItemRequest>
  enviando: boolean
  sucesso: string
}
export interface RetornoEdicaoItem extends EstadoEdicaoItem {
  alterado: boolean
  confirmarDescarte: boolean
  continuarEditando: () => void
  descartar: () => void
  permitido: boolean
  abrir: () => void
  fechar: () => void
  alterar: (campo: keyof UpdateItemRequest, valor: string) => void
  salvar: (evento: FormEvent) => Promise<void>
}

export interface EstadoLocalEdicaoItem {
  estado: EstadoEdicaoItem
  confirmarDescarte: boolean
}
