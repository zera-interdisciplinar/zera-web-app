import { ApiError } from '../types/api'
import { requisitarApiReal } from './apiReal'

export interface ResumoOperacional {
  activeItems: number
  activeItemsChangePercent: number | null
  pendingApproval: number
  inMaintenance: number
  awaitingEvaluation: number
  disposalsInWindow: number
}

export interface IndicadoresDescarte {
  totalWeightKg: number
  recyclingRatePercent: number | null
  recyclingRateChangePoints: number | null
  totalWeightChangePercent: number | null
  monthlyWeightKg: Array<{ month: string; weightKg: number }>
}

function objeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}
const numero = (valor: unknown) => typeof valor === 'number' && Number.isFinite(valor)
const percentual = (valor: unknown) => valor === null || numero(valor)

function resumoValido(valor: unknown): valor is ResumoOperacional {
  if (!objeto(valor) || !['activeItems', 'pendingApproval', 'inMaintenance', 'awaitingEvaluation', 'disposalsInWindow'].every((chave) => numero(valor[chave]))
    || !percentual(valor.activeItemsChangePercent)) {
    return false
  }
  return true
}

function indicadoresValidos(valor: unknown): valor is IndicadoresDescarte {
  if (!objeto(valor) || !numero(valor.totalWeightKg)
    || !['recyclingRatePercent', 'recyclingRateChangePoints', 'totalWeightChangePercent'].every((chave) => percentual(valor[chave]))
    || !Array.isArray(valor.monthlyWeightKg)
    || !valor.monthlyWeightKg.every((ponto) => objeto(ponto) && typeof ponto.month === 'string' && numero(ponto.weightKg))) {
    return false
  }
  return true
}

export async function obterResumoOperacional(sinal?: AbortSignal): Promise<ResumoOperacional> {
  const valor = await requisitarApiReal<unknown>('inventory', '/api/v1/dashboard/home', { sinal, unidade: true })
  if (!resumoValido(valor)) throw new ApiError('O resumo do inventário não corresponde ao contrato esperado.', 0)
  return valor
}
export async function obterIndicadoresDescarte(sinal?: AbortSignal): Promise<IndicadoresDescarte> {
  const valor = await requisitarApiReal<unknown>('inventory', '/api/v1/dashboard/indicators', { sinal, unidade: true })
  if (!indicadoresValidos(valor)) throw new ApiError('Os indicadores de descarte não correspondem ao contrato esperado.', 0)
  return valor
}
