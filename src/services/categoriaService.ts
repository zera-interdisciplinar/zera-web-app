import type { Categoria, NovaCategoria } from '../types/categoria'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao, requisitarApiReal } from './apiReal'
import { ApiError } from '../types/api'
import { ehCategoriaApi } from '../utils/guardaCategoriaApi'
import { lerLista } from '../utils/guardasApi'
import { mapearCategoria } from './mapeadoresApi'
import { invalidarCatalogo } from './catalogoEventos'

export async function listarCategorias(sinal?: AbortSignal): Promise<Categoria[]> {
  try {
    if (!modoDemonstracao) {
      const dados = await requisitarApiReal<unknown>('inventory', '/api/v1/categories', { sinal, unidade: true })
      return lerLista(dados, ehCategoriaApi).map(mapearCategoria)
    }
    return await requisitar<Categoria[]>('/categories', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar as categorias.')
  }
}

export async function criarCategoria(nova: NovaCategoria): Promise<Categoria> {
  try {
    const resposta = !modoDemonstracao ? await requisitarApiReal<unknown>('inventory', '/api/v1/categories', {
      metodo: 'POST', unidade: true, corpo: { name: nova.nome, description: nova.descricao },
    }) : null
    if (!modoDemonstracao && !ehCategoriaApi(resposta)) throw new ApiError('Não conseguimos confirmar a categoria. Tente novamente.', 0)
    const categoria = ehCategoriaApi(resposta) ? mapearCategoria(resposta) : await requisitar<Categoria>('/categories', { metodo: 'POST', corpo: nova })
    invalidarCatalogo()
    return categoria
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível criar a categoria.')
  }
}
