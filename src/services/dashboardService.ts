import type { ResumoDashboard } from '../types/dashboard'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao, requisitarApiReal } from './apiReal'
import type { HomeSummaryResponse, DisposalIndicatorsResponse } from '../types/apiReal'

export async function obterResumoDashboard(sinal?: AbortSignal): Promise<ResumoDashboard> {
  try {
    if (!modoDemonstracao) {
      const [inicio, indicadores] = await Promise.all([
        requisitarApiReal<HomeSummaryResponse>('inventory', '/api/v1/dashboard/home', { sinal, unidade: true }),
        requisitarApiReal<DisposalIndicatorsResponse>('inventory', '/api/v1/dashboard/indicators', { sinal, unidade: true }),
      ])
      return {
        origem: 'api',
        kpis: {
          itensCadastrados: inicio.activeItems,
          deltaItens: `${inicio.activeItemsChangePercent >= 0 ? '+' : ''}${inicio.activeItemsChangePercent}%`,
          taxaReciclagem: indicadores.recyclingRatePercent,
          deltaReciclagem: `${indicadores.recyclingRateChangePoints >= 0 ? '+' : ''}${indicadores.recyclingRateChangePoints} p.p.`,
          aguardandoAprovacao: inicio.pendingApproval,
          prioritarios: inicio.inMaintenance,
          impactoToneladas: indicadores.totalWeightKg / 1000,
        },
        serie: indicadores.monthlyWeightKg.map((ponto, indice, lista) => ({ mes: ponto.month, total: ponto.weightKg, atual: indice === lista.length - 1 })),
        circularidade: { percentual: indicadores.recyclingRatePercent, meta: 0 },
      }
    }
    return await requisitar<ResumoDashboard>('/dashboard/summary', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os indicadores.')
  }
}
