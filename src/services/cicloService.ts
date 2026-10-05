import { contextualizar } from './http'
import { listarPaginas, requisitarApiReal } from './apiReal'
import type { DisposalResponse, EventResponse, UnitSettingsResponse } from '../types/apiReal'

export async function listarEventos(id: number | string, sinal?: AbortSignal): Promise<EventResponse[]> {
  try {
    return await listarPaginas<EventResponse>('inventory', `/api/v1/items/${encodeURIComponent(id)}/events`, sinal)
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os eventos do item.')
  }
}

export async function listarDescartes(sinal?: AbortSignal): Promise<DisposalResponse[]> {
  try {
    return await listarPaginas<DisposalResponse>('inventory', '/api/v1/disposals', sinal)
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os registros de descarte.')
  }
}

export async function obterCapacidade(sinal?: AbortSignal): Promise<UnitSettingsResponse> {
  try {
    return await requisitarApiReal<UnitSettingsResponse>('inventory', '/api/v1/unit-settings', { sinal, unidade: true })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível consultar a capacidade da unidade.')
  }
}
