import type { Modelo, NovoModelo } from '../types/modelo'
import { contextualizar, requisitar } from './http'
import { listarPaginas, modoDemonstracao } from './apiReal'
import type { ModelResponse } from '../types/apiReal'
import { mapearModelo } from './mapeadoresApi'

export async function listarModelos(sinal?: AbortSignal): Promise<Modelo[]> {
  try {
    if (!modoDemonstracao) return (await listarPaginas<ModelResponse>('inventory', '/api/v1/models', sinal)).map(mapearModelo)
    return await requisitar<Modelo[]>('/models', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os modelos.')
  }
}

export async function listarModelosPorCategoria(
  categoriaId: number | string,
  sinal?: AbortSignal,
): Promise<Modelo[]> {
  try {
    if (!modoDemonstracao) return (await listarModelos(sinal)).filter((modelo) => modelo.categoriaId === categoriaId)
    return await requisitar<Modelo[]>(`/models?categoryId=${categoriaId}`, { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os modelos da categoria.')
  }
}

export async function criarModelo(novo: NovoModelo): Promise<Modelo> {
  try {
    if (!modoDemonstracao) throw new Error('Cadastro de modelo exige materiais e revisão no contrato real. Operação indisponível nesta interface.')
    return await requisitar<Modelo>('/models', { metodo: 'POST', corpo: novo })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível criar o modelo.')
  }
}
