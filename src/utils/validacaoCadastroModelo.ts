import type { CadastroModeloReal, CodigoMaterial } from '../types/cadastroModelo'
import type { ResultadoValidacao, ErrosDeCampo } from './validacao'
import { sanitizarTexto } from './sanitizacao'

const MATERIAIS: CodigoMaterial[] = ['PLASTIC', 'METAL', 'GLASS', 'PAPER', 'BATTERY', 'CIRCUIT_BOARD', 'CABLE', 'SCREEN', 'OTHER']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function validarCadastroModeloReal(entrada: CadastroModeloReal): ResultadoValidacao<CadastroModeloReal> {
  const dados: CadastroModeloReal = {
    name: sanitizarTexto(entrada.name), manufacturer: sanitizarTexto(entrada.manufacturer),
    categoryId: entrada.categoryId.trim(), materials: [...new Set(entrada.materials)],
    ...(entrada.notes?.trim() ? { notes: sanitizarTexto(entrada.notes) } : {}),
    ...(entrada.warrantyMonths !== undefined ? { warrantyMonths: entrada.warrantyMonths } : {}),
    ...(entrada.expectedLifespanMonths !== undefined ? { expectedLifespanMonths: entrada.expectedLifespanMonths } : {}),
    ...(entrada.estimatedWeightKg !== undefined ? { estimatedWeightKg: entrada.estimatedWeightKg } : {}),
  }
  const erros: ErrosDeCampo<CadastroModeloReal> = {}
  if (!dados.name) erros.name = 'Informe o nome do modelo.'
  else if (dados.name.length > 120) erros.name = 'O nome pode ter até 120 caracteres.'
  if (!dados.manufacturer) erros.manufacturer = 'Informe a marca ou o fabricante.'
  else if (dados.manufacturer.length > 120) erros.manufacturer = 'O fabricante pode ter até 120 caracteres.'
  if (!UUID.test(dados.categoryId)) erros.categoryId = 'Selecione uma categoria cadastrada.'
  if (!dados.materials.length || dados.materials.some((material) => !MATERIAIS.includes(material))) erros.materials = 'Selecione ao menos um material válido.'
  if ((dados.notes?.length ?? 0) > 500) erros.notes = 'As observações podem ter até 500 caracteres.'
  for (const campo of ['warrantyMonths', 'expectedLifespanMonths'] as const) {
    const valor = dados[campo]
    if (valor !== undefined && (!Number.isInteger(valor) || valor <= 0)) erros[campo] = 'Informe uma quantidade inteira e positiva de meses.'
  }
  if (dados.estimatedWeightKg !== undefined && (!Number.isFinite(dados.estimatedWeightKg) || dados.estimatedWeightKg <= 0)) erros.estimatedWeightKg = 'Informe um peso estimado positivo em quilogramas.'
  return { valido: Object.keys(erros).length === 0, erros, dados }
}
