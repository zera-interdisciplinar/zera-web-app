import { useAmbiente } from './useAmbiente'
import { usePermissoes } from './usePermissoes'
import { useDescartes } from './useDescartes'

export function useListaDescartes() {
  const mostrarResponsavel = usePermissoes().filtrarResponsavel
  const { modoDemonstracao } = useAmbiente()
  const descartes = useDescartes()
  return { mostrarResponsavel, modoDemonstracao, descartes }
}
