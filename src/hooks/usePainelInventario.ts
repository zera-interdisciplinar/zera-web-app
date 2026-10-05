import { useRequisicao } from './useRequisicao'
import { obterIndicadoresDescarte, obterResumoOperacional } from '../services/painelInventarioService'

export function usePainelInventario() {
  const resumo = useRequisicao(obterResumoOperacional)
  const descartes = useRequisicao(obterIndicadoresDescarte)
  return { resumo, descartes }
}
