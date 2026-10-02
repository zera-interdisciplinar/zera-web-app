import type { Configuracoes } from '../types/configuracao'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao } from './apiReal'

export async function obterConfiguracoes(sinal?: AbortSignal): Promise<Configuracoes> {
  try {
    if (!modoDemonstracao) throw new Error('A API só expõe stockCapacity; os parâmetros desta tela não constam do contrato.')
    return await requisitar<Configuracoes>('/settings', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os parâmetros.')
  }
}

export async function salvarConfiguracoes(configuracoes: Configuracoes): Promise<Configuracoes> {
  try {
    if (!modoDemonstracao) throw new Error('Não há contrato para salvar dias de lote crítico ou meta de circularidade.')
    return await requisitar<Configuracoes>('/settings', { metodo: 'PUT', corpo: configuracoes })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível salvar os parâmetros.')
  }
}
