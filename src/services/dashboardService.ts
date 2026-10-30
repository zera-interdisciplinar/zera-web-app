import type { ResumoDashboard } from '../types/dashboard'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao } from './apiReal'
import { acompanharDashboard } from './dashboardSse'
import type { DashboardSnapshot, FiltrosDashboard } from '../types/dashboardAnalytics'
import { ApiError } from '../types/api'
import { formatarPontosPercentuais, formatarVariacao } from '../utils/formatarDashboard'

export { acompanharDashboard } from './dashboardSse'

export async function obterSnapshotDashboard(filtros: FiltrosDashboard, sinal?: AbortSignal): Promise<DashboardSnapshot> {
  try {
    const controlador = new AbortController()
    const timeout = AbortSignal.timeout(195_000)
    const sinalStream = AbortSignal.any([controlador.signal, timeout, ...(sinal ? [sinal] : [])])
    const resultado: { snapshot?: DashboardSnapshot; erro?: ApiError } = {}
    await acompanharDashboard(filtros, sinalStream, {
      onSnapshot(snapshot) { resultado.snapshot = snapshot; controlador.abort() },
      onUnavailable(detail) { resultado.erro = new ApiError(`Ainda não há lote de analytics. ${detail}`, 0); controlador.abort() },
      onError(falha) { resultado.erro = new ApiError(falha.detail, falha.status); controlador.abort() },
      onState() {},
    })
    if (sinal?.aborted) throw new DOMException('Consulta cancelada.', 'AbortError')
    if (resultado.erro) throw resultado.erro
    if (resultado.snapshot) return resultado.snapshot
    throw new ApiError('O serviço de analytics não enviou um snapshot no prazo esperado.', 0)
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os dados de movimentações.')
  }
}

export async function obterResumoDashboard(sinal?: AbortSignal): Promise<ResumoDashboard> {
  try {
    if (!modoDemonstracao) {
      const snapshot = await obterSnapshotDashboard({ period: '6m', view: 'todos' }, sinal)
      return {
        origem: 'api',
        kpis: {
          itensCadastrados: snapshot.kpis.itens_cadastrados.value,
          deltaItens: formatarVariacao(snapshot.kpis.itens_cadastrados.change_percent),
          taxaReciclagem: snapshot.kpis.taxa_reciclagem.percent,
          deltaReciclagem: formatarPontosPercentuais(snapshot.kpis.taxa_reciclagem.change_points),
          aguardandoAprovacao: snapshot.kpis.aguardando_aprovacao.value,
          prioritarios: snapshot.kpis.aguardando_aprovacao.prioritarios,
          impactoToneladas: snapshot.kpis.impacto_recuperado.tonnes,
        },
        serie: snapshot.itens_por_mes.map((ponto, indice, lista) => ({ mes: ponto.mes, total: ponto.cadastrados, atual: indice === lista.length - 1 })),
        circularidade: { percentual: snapshot.circularidade.percent },
      }
    }
    return await requisitar<ResumoDashboard>('/dashboard/summary', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os indicadores.')
  }
}
