import type { Categoria, NovaCategoria } from '../types/categoria'
import { requisitarApiReal } from './apiReal'
import { contextualizar } from './contextualizar'
import { lerCategoriaApi } from '../utils/guardaCategoriaApi'
import { lerLista, ehObjeto } from '../utils/guardasApi'
import { mapearCategoria } from './mapeadoresApi'
import { invalidarCatalogo } from './catalogoEventos'

export async function listarCategorias(sinal?: AbortSignal): Promise<Categoria[]> {
  try {
    const dados = await requisitarApiReal<unknown>('inventory', '/api/v1/categories', { sinal, unidade: true })
    return lerLista(dados, ehObjeto).map(item => mapearCategoria(lerCategoriaApi(item)))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar as categorias.')
  }
}

export async function criarCategoria(nova: NovaCategoria): Promise<Categoria> {
  try {
    const resposta = await requisitarApiReal<unknown>('inventory', '/api/v1/categories', {
      metodo: 'POST', unidade: true, corpo: { name: nova.nome, description: nova.descricao },
    })
    const categoria = mapearCategoria(lerCategoriaApi(resposta))
    invalidarCatalogo()
    return categoria
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível criar a categoria.')
  }
}
