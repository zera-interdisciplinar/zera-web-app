import type { Modelo } from '../types/modelo'
import { listarPaginas } from './apiReal'
import { contextualizar } from './contextualizar'
import { lerModeloApi } from '../utils/guardaModeloApi'
import { mapearModelo } from './mapeadoresApi'

export async function listarModelos(sinal?: AbortSignal): Promise<Modelo[]> {
  try {
    return (await listarPaginas<unknown>('inventory', '/api/v1/models', sinal)).map(item => {
      const modelo = lerModeloApi(item)
      const aprovacao = ['APPROVED', 'PENDING_APPROVAL', 'PENDING', 'REJECTED'].includes(modelo.approvalStatus) ? modelo.approvalStatus : 'Não informado'
      return mapearModelo({ ...modelo, approvalStatus: aprovacao })
    })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os modelos.')
  }
}
