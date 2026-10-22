import { listarPaginas } from './apiReal'
import { contextualizar } from './contextualizar'
import type { EventResponse } from '../types/apiReal'
import { lerEventoApi } from '../utils/guardaCicloApi'

export async function listarEventos(id: number | string, sinal?: AbortSignal): Promise<EventResponse[]> {
  try {
    return (await listarPaginas<unknown>('inventory', `/api/v1/items/${encodeURIComponent(id)}/events`, sinal)).map(lerEventoApi)
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os eventos do item.')
  }
}
