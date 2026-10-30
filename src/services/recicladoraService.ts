import { ApiError } from '../types/api'
import type { NovaRecicladora, Recicladora } from '../types/relatorio'
import { validarNovaRecicladora } from '../utils/validacao'
import { requisitarApiReal } from './apiReal'
import { ehObjeto, ehTexto, lerLista } from '../utils/guardasApi'
import { contextualizar } from './http'

interface EmpresaReciclagem { id: string; name: string; cnpj: string; email: string | null }
function empresaValida(valor: unknown): valor is EmpresaReciclagem {
  return ehObjeto(valor) && ehTexto(valor.id) && valor.id.trim().length > 0
    && ehTexto(valor.name) && valor.name.trim().length > 0 && ehTexto(valor.cnpj) && valor.cnpj.trim().length > 0
    && (ehTexto(valor.email) || valor.email === null)
}
function mapear(empresa: EmpresaReciclagem): Recicladora {
  return { id: empresa.id, nome: empresa.name, cnpj: empresa.cnpj, email: empresa.email ?? undefined, cidade: '' }
}
export async function listarEmpresasReciclagem(sinal?: AbortSignal): Promise<Recicladora[]> {
  try {
    const valor = await requisitarApiReal<unknown>('administrative', '/api/v1/recyclings', { sinal })
    return lerLista(valor, empresaValida).map(mapear)
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar as recicladoras.')
  }
}
export async function cadastrarEmpresaReciclagem(entrada: NovaRecicladora): Promise<Recicladora> {
  try {
  const validacao = validarNovaRecicladora(entrada, true)
  if (!validacao.valido) throw new ApiError(Object.values(validacao.erros)[0] ?? 'Revise os dados da recicladora.', 422)
  const valor = await requisitarApiReal<unknown>('administrative', '/api/v1/recyclings', {
    metodo: 'POST', corpo: { name: validacao.dados.nome, cnpj: validacao.dados.cnpj, email: validacao.dados.email },
  })
  if (!empresaValida(valor)) throw new ApiError('Não conseguimos confirmar o cadastro. Atualize a lista antes de tentar de novo.', 0)
    return mapear(valor)
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível cadastrar a recicladora.')
  }
}
