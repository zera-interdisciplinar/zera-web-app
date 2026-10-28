import { ApiError } from '../types/api'
import type { NovaRecicladora, Recicladora } from '../types/relatorio'
import { validarNovaRecicladora } from '../utils/validacao'
import { requisitarApiReal } from './apiReal'

interface EmpresaReciclagem { id: string; name: string; cnpj: string; email: string | null }
function empresaValida(valor: unknown): valor is EmpresaReciclagem {
  return typeof valor === 'object' && valor !== null && 'id' in valor && typeof valor.id === 'string'
    && 'name' in valor && typeof valor.name === 'string' && 'cnpj' in valor && typeof valor.cnpj === 'string'
    && 'email' in valor && (typeof valor.email === 'string' || valor.email === null)
}
function mapear(empresa: EmpresaReciclagem): Recicladora {
  return { id: empresa.id, nome: empresa.name, cnpj: empresa.cnpj, email: empresa.email ?? undefined, cidade: '' }
}
export async function listarEmpresasReciclagem(sinal?: AbortSignal): Promise<Recicladora[]> {
  const valor = await requisitarApiReal<unknown>('administrative', '/api/v1/recyclings', { sinal })
  if (!Array.isArray(valor) || !valor.every(empresaValida)) throw new ApiError('Não conseguimos ler a lista de recicladoras. Tente novamente.', 0)
  return valor.map(mapear)
}
export async function cadastrarEmpresaReciclagem(entrada: NovaRecicladora): Promise<Recicladora> {
  const validacao = validarNovaRecicladora(entrada, true)
  if (!validacao.valido) throw new ApiError(Object.values(validacao.erros)[0] ?? 'Revise os dados da recicladora.', 422)
  const valor = await requisitarApiReal<unknown>('administrative', '/api/v1/recyclings', {
    metodo: 'POST', corpo: { name: validacao.dados.nome, cnpj: validacao.dados.cnpj, email: validacao.dados.email },
  })
  if (!empresaValida(valor)) throw new ApiError('Não conseguimos confirmar o cadastro. Atualize a lista antes de tentar de novo.', 0)
  return mapear(valor)
}
