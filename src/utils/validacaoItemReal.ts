import type { CadastroItemReal } from '../types/cadastroItem'
import type { ErrosDeCampo, ResultadoValidacao } from './validacao'
import { sanitizarTexto } from './sanitizacao'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validarCadastroItemReal(entrada: CadastroItemReal): ResultadoValidacao<CadastroItemReal> {
  const dados: CadastroItemReal = {
    name: sanitizarTexto(entrada.name),
    barcode: sanitizarTexto(entrada.barcode),
    modelId: entrada.modelId.trim(),
    condition: entrada.condition,
  }
  const erros: ErrosDeCampo<CadastroItemReal> = {}
  if (!dados.name) erros.name = 'Informe o nome do item.'
  else if (dados.name.length > 120) erros.name = 'O nome pode ter até 120 caracteres.'
  if (!dados.barcode) erros.barcode = 'Informe o código de barras do item.'
  else if (dados.barcode.length > 120) erros.barcode = 'O código de barras pode ter até 120 caracteres.'
  if (!UUID.test(dados.modelId)) erros.modelId = 'Selecione um modelo cadastrado.'
  if (!['NEW', 'USED', 'SEMI_DAMAGED', 'DAMAGED'].includes(dados.condition)) {
    erros.condition = 'Selecione a condição do item.'
  }
  return { valido: Object.keys(erros).length === 0, erros, dados }
}
