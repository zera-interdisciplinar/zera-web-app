import { useAmbiente } from './useAmbiente'
import { useAuth } from './useAuth'
import { useDescartes } from './useDescartes'

export function useListaDescartes() {
  const { usuario } = useAuth()
  const { modoDemonstracao } = useAmbiente()
  const descartes = useDescartes()
  return { usuario, modoDemonstracao, descartes }
}
