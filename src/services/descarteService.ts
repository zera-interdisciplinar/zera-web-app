import { ApiError } from '../types/api'
import type { DisposalResponse, ItemResponse } from '../types/apiReal'
import type { ProdutoDetalhado } from '../types/produto'
import type { BuscaLocaisReciclagem, LocalReciclagem, NovoDescarte } from '../types/descarte'
import { validarBuscaLocais, validarNovoDescarte } from '../utils/validacaoDescarte'
import { listarPaginas, requisitarApiReal } from './apiReal'
import { contextualizar } from './http'
import { mapearItem } from './mapeadoresApi'

export async function listarItensElegiveisDescarte(sinal?: AbortSignal): Promise<ProdutoDetalhado[]> {
  try {
    const itens = await listarPaginas<ItemResponse>('inventory', '/api/v1/items?eligibleForDisposal=true', sinal)
    return itens.map(mapearItem)
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível consultar os itens disponíveis para descarte.')
  }
}

export async function registrarDescarte(entrada: NovoDescarte): Promise<DisposalResponse> {
  try {
    const validacao = validarNovoDescarte(entrada)
    if (!validacao.valido) throw new ApiError(Object.values(validacao.erros)[0] ?? 'Revise o descarte.', 422)
    return await requisitarApiReal<DisposalResponse>('inventory', '/api/v1/disposals', {
      metodo: 'POST', corpo: validacao.dados, unidade: true,
    })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível registrar o descarte.')
  }
}

export async function buscarLocaisReciclagem(entrada: BuscaLocaisReciclagem, sinal?: AbortSignal): Promise<LocalReciclagem[]> {
  try {
    const validacao = validarBuscaLocais(entrada)
    if (!validacao.valido) throw new ApiError(Object.values(validacao.erros)[0] ?? 'Revise a localização.', 422)
    const { lat, lng, radiusMeters } = validacao.dados
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) })
    if (radiusMeters !== undefined) params.set('radiusMeters', String(radiusMeters))
    const locais = await requisitarApiReal<LocalReciclagem[]>('administrative', `/api/v1/recycling-places?${params}`, { sinal })
    return locais.map(({ placeId, name, address, lat: latitude, lng: longitude, distanceMeters, isOpen, description, openingHours }) => ({ placeId, name, address, lat: latitude, lng: longitude, distanceMeters, isOpen, description, openingHours }))
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível consultar os pontos de reciclagem.')
  }
}
