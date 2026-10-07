import type { CadastroItemEntrada, CadastroItemReal, DanoItemReal } from '../types/cadastroItem'
import type { ErrosDeCampo, ResultadoValidacao } from './validacao'
import { sanitizarTexto } from './sanitizacao'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const DANOS: DanoItemReal[] = ['BROKEN_SCREEN', 'MISSING_PART', 'DOES_NOT_POWER_ON', 'OXIDATION', 'OTHER']

export function validarCadastroItemReal(entrada: CadastroItemEntrada): ResultadoValidacao<CadastroItemReal> {
  const dados: CadastroItemReal = {
    name: sanitizarTexto(entrada.name),
    barcode: sanitizarTexto(entrada.barcode),
    modelId: entrada.modelId.trim(),
    condition: entrada.condition,
    usageIntensity: entrada.usageIntensity,
    hasDamages: entrada.hasDamages === true,
    damages: entrada.hasDamages === true && Array.isArray(entrada.damages) ? [...new Set(entrada.damages)] : [],
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
  if (!Number.isInteger(dados.usageIntensity) || dados.usageIntensity < 0 || dados.usageIntensity > 10) {
    erros.usageIntensity = 'Informe a intensidade de uso entre 0 e 10.'
  }
  if (typeof entrada.hasDamages !== 'boolean') erros.hasDamages = 'Informe se o item apresenta danos.'
  if (dados.hasDamages && (!dados.damages?.length || dados.damages.some((dano) => !DANOS.includes(dano)))) {
    erros.damages = 'Selecione ao menos um tipo de dano válido.'
  }
  return { valido: Object.keys(erros).length === 0, erros, dados }
}
