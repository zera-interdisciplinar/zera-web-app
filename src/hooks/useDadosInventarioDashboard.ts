import { listarModelos } from '../services/modeloService'
import { obterIndicadoresDescarte } from '../services/painelInventarioService'
import { useRequisicao } from './useRequisicao'

export function useModelosDashboard(ativo: boolean) {
  return useRequisicao(listarModelos, ativo)
}

export function useMateriaisDashboard(ativo: boolean) {
  return useRequisicao(obterIndicadoresDescarte, ativo)
}
