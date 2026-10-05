import type { NovoProduto } from '../types/produto'
import type { Credenciais, NovoUsuario } from '../types/usuario'
import type { NovoModelo } from '../types/modelo'
import type { NovaRecicladora } from '../types/relatorio'
import type { Configuracoes } from '../types/configuracao'
import { sanitizarTexto } from './sanitizacao'

export type ErrosDeCampo<T> = Partial<Record<keyof T, string>>

export interface ResultadoValidacao<T> {
  valido: boolean
  erros: ErrosDeCampo<T>
  dados: T
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CNPJ = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/

export function validarCredenciais(entrada: Credenciais): ResultadoValidacao<Credenciais> {
  const dados: Credenciais = {
    email: sanitizarTexto(entrada.email).slice(0, 120).toLowerCase(),
    senha: entrada.senha.slice(0, 64),
  }
  const erros: ErrosDeCampo<Credenciais> = {}

  if (!dados.email) erros.email = 'Informe o e-mail corporativo.'
  else if (!EMAIL.test(dados.email)) erros.email = 'E-mail inválido. Use o formato nome@empresa.com.'

  if (!dados.senha) erros.senha = 'Informe a senha.'
  else if (dados.senha.length < 6) erros.senha = 'A senha tem no mínimo 6 caracteres.'

  return { valido: Object.keys(erros).length === 0, erros, dados }
}

export function validarNovoProduto(entrada: NovoProduto): ResultadoValidacao<NovoProduto> {
  const dados: NovoProduto = {
    nome: sanitizarTexto(entrada.nome).slice(0, 80),
    categoriaId: entrada.categoriaId,
    marca: sanitizarTexto(entrada.marca).slice(0, 60),
    condicao: entrada.condicao,
  }
  const erros: ErrosDeCampo<NovoProduto> = {}

  if (!dados.nome) erros.nome = 'Informe o nome do item.'
  else if (dados.nome.length < 3) erros.nome = 'Nome muito curto (mínimo 3 caracteres).'

  if (!dados.categoriaId) erros.categoriaId = 'Selecione a categoria do item.'

  if (!dados.marca) erros.marca = 'Informe a marca ou o fabricante.'

  if (!['novo', 'usado', 'danificado'].includes(dados.condicao))
    erros.condicao = 'Selecione a condição do item.'

  return { valido: Object.keys(erros).length === 0, erros, dados }
}

export function validarNovoModelo(entrada: NovoModelo): ResultadoValidacao<NovoModelo> {
  const dados: NovoModelo = {
    categoriaId: entrada.categoriaId,
    fabricante: sanitizarTexto(entrada.fabricante).slice(0, 60),
    nome: sanitizarTexto(entrada.nome).slice(0, 80),
    especificacoes: entrada.especificacoes,
    vidaUtilMeses: Number.isFinite(entrada.vidaUtilMeses) ? entrada.vidaUtilMeses : 0,
  }
  const erros: ErrosDeCampo<NovoModelo> = {}

  if (!dados.nome) erros.nome = 'Informe o nome do modelo.'
  if (!dados.fabricante) erros.fabricante = 'Informe o fabricante.'
  if (!dados.categoriaId) erros.categoriaId = 'Selecione a categoria.'
  if (dados.vidaUtilMeses < 1 || dados.vidaUtilMeses > 600)
    erros.vidaUtilMeses = 'Vida útil entre 1 e 600 meses.'

  return { valido: Object.keys(erros).length === 0, erros, dados }
}

export function validarNovaRecicladora(
  entrada: NovaRecicladora,
  modoReal: boolean = false,
): ResultadoValidacao<NovaRecicladora> {
  const dados: NovaRecicladora = {
    nome: sanitizarTexto(entrada.nome).slice(0, 80),
    cnpj: sanitizarTexto(entrada.cnpj).slice(0, 18),
    cidade: sanitizarTexto(entrada.cidade).slice(0, 60),
    email: sanitizarTexto(entrada.email ?? '').slice(0, 120).toLowerCase(),
  }
  const erros: ErrosDeCampo<NovaRecicladora> = {}

  if (!dados.nome) erros.nome = 'Informe o nome da cooperativa.'
  if (!CNPJ.test(dados.cnpj)) erros.cnpj = 'CNPJ no formato 12.345.678/0001-90.'
  if (modoReal) {
    if (!EMAIL.test(dados.email ?? '')) erros.email = 'Informe um e-mail válido para a recicladora.'
  } else if (!dados.cidade) erros.cidade = 'Informe a cidade de coleta.'

  return { valido: Object.keys(erros).length === 0, erros, dados }
}

export function validarNovoUsuario(entrada: NovoUsuario): ResultadoValidacao<NovoUsuario> {
  const dados: NovoUsuario = {
    nome: sanitizarTexto(entrada.nome).slice(0, 80),
    email: sanitizarTexto(entrada.email).slice(0, 120).toLowerCase(),
    perfil: entrada.perfil,
    unidade: sanitizarTexto(entrada.unidade).slice(0, 60),
  }
  const erros: ErrosDeCampo<NovoUsuario> = {}

  if (!dados.nome) erros.nome = 'Informe o nome completo.'
  if (!EMAIL.test(dados.email)) erros.email = 'E-mail inválido. Use o formato nome@empresa.com.'
  if (!['funcionario', 'gestor', 'administrador'].includes(dados.perfil))
    erros.perfil = 'Selecione o perfil de acesso.'
  if (!dados.unidade) erros.unidade = 'Informe a unidade de trabalho.'

  return { valido: Object.keys(erros).length === 0, erros, dados }
}

export function validarConfiguracoes(entrada: Configuracoes): ResultadoValidacao<Configuracoes> {
  const dados: Configuracoes = {
    diasLoteCritico: Number.isFinite(entrada.diasLoteCritico) ? entrada.diasLoteCritico : 0,
    metaCircularidade: Number.isFinite(entrada.metaCircularidade) ? entrada.metaCircularidade : 0,
  }
  const erros: ErrosDeCampo<Configuracoes> = {}

  if (dados.diasLoteCritico < 7 || dados.diasLoteCritico > 365)
    erros.diasLoteCritico = 'Entre 7 e 365 dias.'
  if (dados.metaCircularidade < 1 || dados.metaCircularidade > 100)
    erros.metaCircularidade = 'Entre 1% e 100%.'

  return { valido: Object.keys(erros).length === 0, erros, dados }
}

export interface EnvioRelatorio {
  recicladoraId: number
}

export function validarEnvioRelatorio(entrada: EnvioRelatorio): ResultadoValidacao<EnvioRelatorio> {
  const dados: EnvioRelatorio = { recicladoraId: entrada.recicladoraId }
  const erros: ErrosDeCampo<EnvioRelatorio> = {}
  if (!dados.recicladoraId) erros.recicladoraId = 'Selecione a cooperativa que vai receber o lote.'
  return { valido: Object.keys(erros).length === 0, erros, dados }
}
