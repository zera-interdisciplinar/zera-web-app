import type { FormEvent } from 'react'
import type { LocalReciclagem } from './descarte'
import type { ErrosDeCampo } from '../utils/validacao'

export interface FormBuscaLocais {
  lat: string
  lng: string
  radiusMeters: string
}

export interface EstadoBuscaLocais {
  form: FormBuscaLocais
  erros: ErrosDeCampo<FormBuscaLocais>
  locais: LocalReciclagem[] | null
  carregando: boolean
  erro: string | null
  localizando: boolean
  feedbackLocalizacao: string
  erroLocalizacao: string | null
}

export interface RetornoBuscaLocais extends EstadoBuscaLocais {
  alterar: (campo: keyof FormBuscaLocais, valor: string) => void
  buscar: (evento: FormEvent<HTMLFormElement>) => Promise<void>
  usarLocalizacao: () => void
}

export interface LocaisReciclagemProps {
  aoSelecionar?: (local: LocalReciclagem) => void
  selecionadoId?: string
}
