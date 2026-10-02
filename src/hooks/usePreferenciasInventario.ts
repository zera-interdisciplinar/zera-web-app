import { useCallback, useState } from 'react'
import type { StatusItem } from '../types/produto'
import { CHAVE_PREFERENCIAS_INVENTARIO, carregar, salvar } from '../utils/storage'

export interface PreferenciasInventario {
  statusFiltro: StatusItem | 'todos'
}

const PADRAO: PreferenciasInventario = { statusFiltro: 'todos' }

export function usePreferenciasInventario(): [
  PreferenciasInventario,
  (parcial: Partial<PreferenciasInventario>) => void,
] {
  const [preferencias, setPreferencias] = useState<PreferenciasInventario>(
    () => carregar<PreferenciasInventario>(CHAVE_PREFERENCIAS_INVENTARIO) ?? PADRAO,
  )

  const atualizar = useCallback((parcial: Partial<PreferenciasInventario>) => {
    setPreferencias((atual) => {
      const proximo = { ...atual, ...parcial }
      salvar(CHAVE_PREFERENCIAS_INVENTARIO, proximo)
      return proximo
    })
  }, [])

  return [preferencias, atualizar]
}
