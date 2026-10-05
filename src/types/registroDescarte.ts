import type { FormEvent } from 'react'
import type { EstadoRequisicao } from '../hooks/useRequisicao'
import type { ErrosDeCampo } from '../utils/validacao'
import type { LocalReciclagem, NovoDescarte } from './descarte'
import type { ProdutoDetalhado } from './produto'

export interface EstadoRegistroDescarte {
  form: NovoDescarte
  erros: ErrosDeCampo<NovoDescarte>
  enviando: boolean
  erro: string | null
  sucesso: string
}

export interface RetornoRegistroDescarte extends EstadoRegistroDescarte {
  itens: EstadoRequisicao<ProdutoDetalhado[]>
  permitido: boolean
  hoje: string
  alterar: (campo: 'destination' | 'disposedAt' | 'notes' | 'placeName', valor: string) => void
  alternarItem: (id: string) => void
  selecionarLocal: (local: LocalReciclagem) => void
  removerLocal: () => void
  salvar: (evento: FormEvent<HTMLFormElement>) => Promise<void>
}

export interface RegistroDescarteProps {
  aoConcluir: () => void
}
