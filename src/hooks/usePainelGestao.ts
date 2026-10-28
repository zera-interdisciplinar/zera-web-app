import type { SetStateAction } from 'react'
import { useMemo, useState } from 'react'
import type { FiltrosDashboard } from '../types/dashboardAnalytics'
import type { AbaId, DefinicaoFiltro, EstadoLocalPainelGestao, FiltroKey } from '../types/controles/EstadoLocalPainelGestao'
import { useCategorias } from './useCategorias'
import { useDashboardSse } from './useDashboardSse'

const statusLabels: Record<string, string> = {
  PENDING_APPROVAL: 'Aguardando aprovação',
  DISCARDED: 'Descartado',
  ACTIVE: 'Em estoque',
  IN_MAINTENANCE: 'Em manutenção',
  REUSED: 'Reuso',
  REMOVED: 'Removido',
}

export function usePainelGestao() {
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalPainelGestao>(() => ({
    aba: 'operational',
    filtros: { period: '6m', view: 'todos' },
  }))
  const { aba, filtros } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setAba, setFiltros } = useMemo(() => ({
    setAba: (valor: SetStateAction<EstadoLocalPainelGestao['aba']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.aba) : valor
      return Object.is(atual.aba, proximo) ? atual : { ...atual, aba: proximo }
    }),
    setFiltros: (valor: SetStateAction<EstadoLocalPainelGestao['filtros']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.filtros) : valor
      return Object.is(atual.filtros, proximo) ? atual : { ...atual, filtros: proximo }
    }),
  }), [])
  const usaStream = ['overview', 'evolution', 'quality'].includes(aba)
  const { snapshot, estado, indisponivel, erro, recarregar } = useDashboardSse(filtros, usaStream)
  const catalogo = useCategorias()
  const categorias = [...new Set([...(snapshot?.available_filters.categories ?? []), ...(catalogo.dados?.map((categoria) => categoria.nome) ?? [])])]
  const status = snapshot?.available_filters.statuses ?? []
  const unidades = snapshot?.available_filters.units ?? []
  const opcoesStatus = status.map((value) => ({ value, label: statusLabels[value] ?? 'Não informado' }))
  const opcoesCategoria = categorias.map((value) => ({ value, label: value }))
  const opcoesUnidade = unidades.map((unidade) => ({ value: unidade.id, label: unidade.name }))
  const opcoesResponsavel = snapshot?.available_filters.responsibles.map(({ id, name }) => ({ value: id, label: name })) ?? []
  const filtrosPorAba: Record<AbaId, DefinicaoFiltro[]> = {
    operational: [],
    overview: [
      { key: 'period', label: 'Período', options: ['30d', '6m', '12m'].map((value) => ({ value, label: value })) },
      { key: 'view', label: 'Visão', options: ['todos', 'pendentes', 'categoria'].map((value) => ({ value, label: value })) },
      { key: 'status', label: 'Situação', options: opcoesStatus },
      { key: 'category', label: 'Categoria', options: opcoesCategoria },
      { key: 'unitId', label: 'Unidade', options: opcoesUnidade },
      { key: 'responsible', label: 'Responsável', options: opcoesResponsavel },
    ],
    life: [],
    evolution: [],
    quality: [],
    materials: [],
  }
  const alterarFiltro = (key: FiltroKey, value: string) => {
    setFiltros((atuais) => {
      const atualizados = { ...atuais, [key]: value || undefined } as FiltrosDashboard
      if (key === 'period') {
        atualizados.period = (value || '6m') as FiltrosDashboard['period']
        atualizados.from = undefined
        atualizados.to = undefined
      }
      return atualizados
    })
  }
  return { aba, setAba, filtros, usaStream, snapshot, estado, indisponivel, erro, recarregar, status, filtrosPorAba, alterarFiltro }
}
