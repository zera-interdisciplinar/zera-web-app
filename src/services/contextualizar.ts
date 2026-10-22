import { ApiError } from '../types/api'

export function contextualizar(erro: unknown, contexto: string): unknown {
  if (erro instanceof DOMException && erro.name === 'AbortError') return erro
  if (erro instanceof ApiError) return new ApiError(`${contexto} ${erro.message}`, erro.status, erro.campo, erro.tipoFalha)
  return new ApiError(contexto, 0)
}
