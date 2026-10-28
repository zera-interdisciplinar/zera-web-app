import type { ReactNode } from 'react'
import type { PreferenciasAcessibilidade } from '../acessibilidade'

export interface ValorAcessibilidade {
  preferencias: PreferenciasAcessibilidade
  alterar: (alteracoes: Partial<PreferenciasAcessibilidade>) => void
  restaurar: () => void
}

export interface AcessibilidadeContextProps {
  children: ReactNode
}
