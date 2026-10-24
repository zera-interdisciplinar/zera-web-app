import type { FormManutencao } from '../types/controles/EstadoLocalDetalheItem'
import type { ErrosDeCampo, ResultadoValidacao } from './validacao'
import { sanitizarTexto } from './sanitizacao'

export function validarManutencao(entrada: FormManutencao): ResultadoValidacao<FormManutencao> {
  const dados: FormManutencao = {
    tipo: entrada.tipo,
    descricao: sanitizarTexto(entrada.descricao).slice(0, 280),
    tecnico: sanitizarTexto(entrada.tecnico).slice(0, 80),
  }
  const erros: ErrosDeCampo<FormManutencao> = {}

  if (dados.descricao.length < 10) erros.descricao = 'Descreva o que foi feito com pelo menos 10 caracteres.'
  if (dados.tecnico.length < 3) erros.tecnico = 'Informe o nome do técnico responsável.'

  return { valido: Object.keys(erros).length === 0, erros, dados }
}
