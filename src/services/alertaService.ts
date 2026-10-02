import type { AlertaLote } from '../types/alerta'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao } from './apiReal'

export async function listarAlertasDeLote(sinal?: AbortSignal): Promise<AlertaLote[]> {
  try {
    if (!modoDemonstracao) throw new Error('O contrato não expõe alertas agrupados por lote e prazo de categoria.')
    return await requisitar<AlertaLote[]>('/alerts/batches', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os alertas de lote.')
  }
}
