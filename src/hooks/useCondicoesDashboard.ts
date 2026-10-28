import { useMemo } from 'react'
import { useProdutos } from './useProdutos'
import type { EstadoRequisicao } from './useRequisicao'
import type { PontoBarra } from '../types/componentes/BarChart'
import { ROTULO_CONDICAO } from '../types/produto'
import type { Condicao } from '../types/produto'

export function useCondicoesDashboard(): EstadoRequisicao<PontoBarra[]> {
  const itens = useProdutos()
  // Mantém a agregação estável enquanto a coleção de itens não muda.
  const pontos = useMemo(() => itens.dados ? (Object.keys(ROTULO_CONDICAO) as Condicao[]).map(condicao => ({ id: condicao, rotulo: ROTULO_CONDICAO[condicao], valor: itens.dados!.filter(item => item.condicao === condicao).length })) : null, [itens.dados])
  return { ...itens, dados: pontos }
}
