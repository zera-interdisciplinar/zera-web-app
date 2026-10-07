import { modoDemonstracao } from '../services/apiReal'

interface Ambiente { modoDemonstracao: boolean }

export function useAmbiente(): Ambiente {
  return { modoDemonstracao }
}
