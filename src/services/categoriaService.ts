import type { Categoria, NovaCategoria } from '../types/categoria'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao, requisitarApiReal } from './apiReal'
import type { CategoryResponse } from '../types/apiReal'
import { mapearCategoria } from './mapeadoresApi'

export async function listarCategorias(sinal?: AbortSignal): Promise<Categoria[]> {
  try {
    if (!modoDemonstracao) {
      const dados = await requisitarApiReal<CategoryResponse[]>('inventory', '/api/v1/categories', { sinal, unidade: true })
      return dados.map(mapearCategoria)
    }
    return await requisitar<Categoria[]>('/categories', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar as categorias.')
  }
}

export async function criarCategoria(nova: NovaCategoria): Promise<Categoria> {
  try {
    if (!modoDemonstracao) return mapearCategoria(await requisitarApiReal<CategoryResponse>('inventory', '/api/v1/categories', {
      metodo: 'POST', unidade: true, corpo: { name: nova.nome, description: nova.descricao },
    }))
    return await requisitar<Categoria>('/categories', { metodo: 'POST', corpo: nova })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível criar a categoria.')
  }
}
