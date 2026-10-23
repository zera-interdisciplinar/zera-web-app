import { ehLocalApi } from '../utils/guardaDescarteApi'
import { lerLista } from '../utils/guardasApi'
import { ApiError } from '../types/api'
import type { BuscaLocaisReciclagem, LocalReciclagem } from '../types/descarte'
import { validarBuscaLocais } from '../utils/validacaoDescarte'
import { requisitarApiReal } from './apiReal'
import { contextualizar } from './http'

export async function buscarLocaisReciclagem(entrada: BuscaLocaisReciclagem, sinal?: AbortSignal): Promise<LocalReciclagem[]> {
  try {
    const validacao = validarBuscaLocais(entrada)
    if (!validacao.valido) throw new ApiError(Object.values(validacao.erros)[0] ?? 'Revise a localização.', 422)
    const { lat, lng, radiusMeters } = validacao.dados
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
    if (radiusMeters !== undefined) params.set('radiusMeters', String(radiusMeters))
    const locais = await requisitarApiReal<unknown>('administrative', `/api/v1/recycling-places?${params}`, { sinal })
    return lerLista(locais, ehLocalApi).map(({ placeId, name, address, lat: latitude, lng: longitude, distanceMeters, isOpen, description, openingHours }) => ({ placeId, name, address, lat: latitude, lng: longitude, distanceMeters, isOpen, description, openingHours }))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível consultar os pontos de reciclagem.')
  }
}
