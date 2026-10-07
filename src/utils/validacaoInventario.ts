import type { NovaCategoria } from '../types/categoria'
import type { UpdateItemRequest } from '../types/apiReal'
import type { ResultadoValidacao, ErrosDeCampo } from './validacao'
import { sanitizarTexto } from './sanitizacao'

export function validarCategoria(entrada: NovaCategoria): ResultadoValidacao<NovaCategoria> {
  const dados = { ...entrada, nome: sanitizarTexto(entrada.nome), descricao: sanitizarTexto(entrada.descricao) }
  const erros: ErrosDeCampo<NovaCategoria> = {}
  if (!dados.nome) erros.nome = 'Informe o nome da categoria.'
  else if (dados.nome.length > 80) erros.nome = 'Use até 80 caracteres no nome.'
  if (!dados.descricao) erros.descricao = 'Descreva os itens desta categoria.'
  else if (dados.descricao.length > 255) erros.descricao = 'Use até 255 caracteres na descrição.'
  return { dados, erros, valido: Object.keys(erros).length === 0 }
}

export function validarEdicaoItem(entrada: UpdateItemRequest): ResultadoValidacao<UpdateItemRequest> {
  const dados = { ...entrada, name: sanitizarTexto(entrada.name), notes: sanitizarTexto(entrada.notes) }
  const erros: ErrosDeCampo<UpdateItemRequest> = {}
  if (!dados.name) erros.name = 'Informe o nome do item.'
  else if (dados.name.length > 120) erros.name = 'Use até 120 caracteres no nome.'
  if (dados.notes.length > 500) erros.notes = 'Use até 500 caracteres nas observações.'
  if (!['NEW', 'USED', 'SEMI_DAMAGED', 'DAMAGED'].includes(dados.condition)) erros.condition = 'Selecione a condição do item.'
  return { dados, erros, valido: Object.keys(erros).length === 0 }
}

export function validarCodigoEtiqueta(entrada: { codigo: string }): ResultadoValidacao<{ codigo: string }> {
  const dados = { codigo: sanitizarTexto(entrada.codigo) }
  const erros: ErrosDeCampo<{ codigo: string }> = {}
  if (!dados.codigo) erros.codigo = 'Informe o código da etiqueta.'
  else if (dados.codigo.length > 120) erros.codigo = 'Use até 120 caracteres no código.'
  return { dados, erros, valido: Object.keys(erros).length === 0 }
}
