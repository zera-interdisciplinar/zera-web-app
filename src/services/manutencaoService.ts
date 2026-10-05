import type { AnalisePreventiva, Manutencao, NovaManutencao } from '../types/manutencao'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao } from './apiReal'

export async function listarManutencoes(
  produtoId: number | string,
  sinal?: AbortSignal,
): Promise<Manutencao[]> {
  try {
    if (!modoDemonstracao) throw new Error('Histórico de manutenção não é documentado neste endpoint. Use os eventos do item após adaptação da tela.')
    return await requisitar<Manutencao[]>(`/items/${produtoId}/maintenances`, { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar o histórico de manutenções.')
  }
}

export async function registrarManutencao(nova: NovaManutencao): Promise<Manutencao> {
  try {
    if (!modoDemonstracao) throw new Error('A manutenção real usa transições de estado, não este formulário.')
    return await requisitar<Manutencao>(`/items/${nova.produtoId}/maintenances`, {
      metodo: 'POST',
      corpo: nova,
    })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível registrar a manutenção.')
  }
}

export async function analisarPreventiva(
  produtoId: number | string,
  sinal?: AbortSignal,
): Promise<AnalisePreventiva> {
  try {
    if (!modoDemonstracao) throw new Error('Análise preventiva não é documentada na API de inventário.')
    return await requisitar<AnalisePreventiva>(`/items/${produtoId}/preventive-analysis`, { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível calcular a análise preventiva.')
  }
}
