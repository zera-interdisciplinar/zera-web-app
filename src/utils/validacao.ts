import type { Credenciais } from '../types/usuario'
import { sanitizarTexto } from './sanitizacao'

export type ErrosDeCampo<T> = Partial<Record<keyof T, string>>

export interface ResultadoValidacao<T> {
  valido: boolean
  erros: ErrosDeCampo<T>
  dados: T
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

interface ResultadoEmailRecuperacao {
  valido: boolean
  email: string
  erro?: string
}

export function validarEmailRecuperacao(entrada: string): ResultadoEmailRecuperacao {
  const email = sanitizarTexto(entrada).slice(0, 120).toLowerCase()
  if (!EMAIL.test(email)) return { valido: false, email, erro: 'Informe um e-mail válido.' }
  if (email.split('@')[1] !== 'zera.com') return { valido: false, email, erro: 'Use um e-mail @zera.com.' }
  return { valido: true, email }
}

export function validarCredenciais(entrada: Credenciais): ResultadoValidacao<Credenciais> {
  const dados: Credenciais = {
    email: sanitizarTexto(entrada.email).slice(0, 120).toLowerCase(),
    senha: entrada.senha.slice(0, 128),
  }
  const erros: ErrosDeCampo<Credenciais> = {}

  if (!dados.email) erros.email = 'Informe o e-mail corporativo.'
  else if (!EMAIL.test(dados.email)) erros.email = 'E-mail inválido. Use o formato nome@empresa.com.'

  if (!dados.senha) erros.senha = 'Informe a senha.'
  else if (dados.senha.length < 6) erros.senha = 'Confira a senha e tente novamente.'

  return { valido: Object.keys(erros).length === 0, erros, dados }
}
