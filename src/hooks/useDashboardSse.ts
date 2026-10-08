import type { SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { observarCatalogo } from '../services/catalogoEventos'
import { acompanharDashboard } from '../services/dashboardService'
import type { FiltrosDashboard } from '../types/dashboardAnalytics'
import type { EstadoLocalDashboardSse } from '../types/controles/EstadoLocalDashboardSse'

export function useDashboardSse(filtros: FiltrosDashboard, habilitado = true) {
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalDashboardSse>(() => ({
    tentativa: 0,
    snapshotAtual: null,
    estadoAtual: null,
    indisponivelAtual: null,
    erroAtual: null,
  }))
  const { tentativa, snapshotAtual, estadoAtual, indisponivelAtual, erroAtual } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setTentativa, setSnapshotAtual, setEstadoAtual, setIndisponivelAtual, setErroAtual } = useMemo(() => ({
    setTentativa: (valor: SetStateAction<EstadoLocalDashboardSse['tentativa']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.tentativa) : valor
      return Object.is(atual.tentativa, proximo) ? atual : { ...atual, tentativa: proximo }
    }),
    setSnapshotAtual: (valor: SetStateAction<EstadoLocalDashboardSse['snapshotAtual']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.snapshotAtual) : valor
      return Object.is(atual.snapshotAtual, proximo) ? atual : { ...atual, snapshotAtual: proximo }
    }),
    setEstadoAtual: (valor: SetStateAction<EstadoLocalDashboardSse['estadoAtual']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.estadoAtual) : valor
      return Object.is(atual.estadoAtual, proximo) ? atual : { ...atual, estadoAtual: proximo }
    }),
    setIndisponivelAtual: (valor: SetStateAction<EstadoLocalDashboardSse['indisponivelAtual']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.indisponivelAtual) : valor
      return Object.is(atual.indisponivelAtual, proximo) ? atual : { ...atual, indisponivelAtual: proximo }
    }),
    setErroAtual: (valor: SetStateAction<EstadoLocalDashboardSse['erroAtual']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erroAtual) : valor
      return Object.is(atual.erroAtual, proximo) ? atual : { ...atual, erroAtual: proximo }
    }),
  }), [])
  // Mantém a ação estável para os consumidores e efeitos que a recebem.
  const recarregar = useCallback(() => setTentativa((atual) => atual + 1), [setTentativa])
  useEffect(() => observarCatalogo(recarregar), [recarregar])
  // Serializa os filtros uma vez por alteração para controlar a assinatura.
  const chaveFiltros = useMemo(() => JSON.stringify(filtros), [filtros])

  useEffect(() => {
    if (!habilitado) return

    const filtrosAtuais = JSON.parse(chaveFiltros) as FiltrosDashboard
    const controlador = new AbortController()
    void acompanharDashboard(filtrosAtuais, controlador.signal, {
      onSnapshot: (novoSnapshot) => {
        if (controlador.signal.aborted) return
        setSnapshotAtual((atual) => atual?.chave === chaveFiltros && atual.valor.batch_id === novoSnapshot.batch_id
          ? atual
          : { chave: chaveFiltros, valor: novoSnapshot })
        setIndisponivelAtual(null)
        setErroAtual(null)
        setEstadoAtual({ chave: chaveFiltros, valor: 'connected' })
      },
      onUnavailable: (detail) => {
        if (controlador.signal.aborted) return
        setSnapshotAtual(null)
        setErroAtual(null)
        setIndisponivelAtual({ chave: chaveFiltros, valor: detail })
      },
      onError: (falha) => { if (!controlador.signal.aborted) setErroAtual({ chave: chaveFiltros, valor: falha }) },
      onState: (novoEstado) => { if (!controlador.signal.aborted) setEstadoAtual({ chave: chaveFiltros, valor: novoEstado }) },
    })

    return () => controlador.abort()
  }, [chaveFiltros, habilitado, setErroAtual, setEstadoAtual, setIndisponivelAtual, setSnapshotAtual, tentativa])

  return {
    recarregar,
    snapshot: snapshotAtual?.chave === chaveFiltros ? snapshotAtual.valor : null,
    estado: !habilitado ? 'connected' : estadoAtual?.chave === chaveFiltros ? estadoAtual.valor : 'connecting',
    indisponivel: indisponivelAtual?.chave === chaveFiltros ? indisponivelAtual.valor : null,
    erro: erroAtual?.chave === chaveFiltros ? erroAtual.valor : null,
  }
}
