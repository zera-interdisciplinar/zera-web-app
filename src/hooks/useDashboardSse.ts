import { useEffect, useMemo, useState } from 'react'
import type { DashboardSnapshot, FiltrosDashboard } from '../types/dashboardAnalytics'
import { acompanharDashboard } from '../services/dashboardSse'
import type { EstadoConexaoDashboard, FalhaDashboard } from '../services/dashboardSse'

type EstadoPorFiltro<T> = { chave: string; valor: T }

export function useDashboardSse(filtros: FiltrosDashboard) {
  const chaveFiltros = useMemo(() => JSON.stringify(filtros), [filtros])
  const [snapshotAtual, setSnapshotAtual] = useState<EstadoPorFiltro<DashboardSnapshot> | null>(null)
  const [estadoAtual, setEstadoAtual] = useState<EstadoPorFiltro<EstadoConexaoDashboard> | null>(null)
  const [indisponivelAtual, setIndisponivelAtual] = useState<EstadoPorFiltro<string> | null>(null)
  const [erroAtual, setErroAtual] = useState<EstadoPorFiltro<FalhaDashboard> | null>(null)

  useEffect(() => {
    const filtrosAtuais = JSON.parse(chaveFiltros) as FiltrosDashboard
    const controlador = new AbortController()
    void acompanharDashboard(filtrosAtuais, controlador.signal, {
      onSnapshot: (novoSnapshot) => {
        setSnapshotAtual((atual) => atual?.chave === chaveFiltros && atual.valor.batch_id === novoSnapshot.batch_id
          ? atual
          : { chave: chaveFiltros, valor: novoSnapshot })
        setIndisponivelAtual(null)
        setErroAtual(null)
        setEstadoAtual({ chave: chaveFiltros, valor: 'connected' })
      },
      onUnavailable: (detail) => setIndisponivelAtual({ chave: chaveFiltros, valor: detail }),
      onError: (falha) => setErroAtual({ chave: chaveFiltros, valor: falha }),
      onState: (novoEstado) => setEstadoAtual({ chave: chaveFiltros, valor: novoEstado }),
    })

    return () => controlador.abort()
  }, [chaveFiltros])

  return {
    snapshot: snapshotAtual?.chave === chaveFiltros ? snapshotAtual.valor : null,
    estado: estadoAtual?.chave === chaveFiltros ? estadoAtual.valor : 'connecting',
    indisponivel: indisponivelAtual?.chave === chaveFiltros ? indisponivelAtual.valor : null,
    erro: erroAtual?.chave === chaveFiltros ? erroAtual.valor : null,
  }
}
