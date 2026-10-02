import { useContext } from 'react'
import { AcessibilidadeContext } from '../context/AcessibilidadeContext'

export function useAcessibilidade() {
  const contexto = useContext(AcessibilidadeContext)
  if (!contexto) throw new Error('AcessibilidadeProvider não encontrado.')
  return contexto
}
