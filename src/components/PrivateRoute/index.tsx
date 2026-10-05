import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../../hooks/useAuth'
import type { Perfil } from '../../types/usuario'
import { ROTULO_PERFIL } from '../../types/usuario'
import { Button } from '../Button'
import { EmptyState } from '../EmptyState'

export interface PrivateRouteProps {
  children: ReactNode
  perfis?: Perfil[]
}

export function PrivateRoute({ children, perfis }: PrivateRouteProps) {
  const { autenticado, usuario, temPerfil } = useAuth()
  const localizacao = useLocation()
  const navegar = useNavigate()

  if (!autenticado) {
    return <Navigate to="/login" state={{ de: localizacao.pathname }} replace />
  }

  if (perfis && !temPerfil(perfis)) {
    return (
      <EmptyState
        nivelTitulo="h1"
        titulo="Acesso restrito"
        descricao={`Esta área exige perfil ${perfis.map((perfil) => ROTULO_PERFIL[perfil].toLowerCase()).join(' ou ')}. Seu perfil (${usuario ? ROTULO_PERFIL[usuario.perfil] : '—'}) não tem essa permissão.`}
        acao={
          <Button variante="primario" onClick={() => navegar(-1)}>
            Voltar
          </Button>
        }
      />
    )
  }

  return <>{children}</>
}
