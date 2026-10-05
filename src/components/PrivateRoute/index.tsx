import type { PrivateRouteProps } from '../../types/componentes/PrivateRoute'
export type { PrivateRouteProps } from '../../types/componentes/PrivateRoute'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import { usePermissoes } from '../../hooks/usePermissoes'

import { ROTULO_PERFIL } from '../../types/usuario'
import { Button } from '../Button'
import { EmptyState } from '../EmptyState'

export function PrivateRoute({ children, perfis, permissao }: PrivateRouteProps) {
  const { autenticado, usuario, temPerfil } = useAuth()
  const localizacao = useLocation()
  const navegar = useNavigate()
  const permissoes = usePermissoes()

  if (!autenticado) {
    return <Navigate to="/login" state={{ de: localizacao.pathname }} replace />
  }

  if (!permissoes.ler || (perfis && !temPerfil(perfis)) || (permissao && !permissoes[permissao])) {
    return (
      <EmptyState
        nivelTitulo="h1"
        titulo="Acesso restrito"
        descricao={perfis ? `Esta área exige perfil ${perfis.map((perfil) => ROTULO_PERFIL[perfil].toLowerCase()).join(' ou ')}. Seu perfil (${usuario ? ROTULO_PERFIL[usuario.perfil] : '—'}) não tem essa permissão.` : 'Esta área não está disponível para sua conta neste ambiente.'}
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
