import { useMemo } from 'react'
import { sessionManager, useSession } from '../shared/auth'
import type { AuthContextProps } from '../types/componentes/AuthContext'
import type { Usuario, ValorAuth } from '../types/usuario'
import { AuthContext } from './auth'

/** Expõe a sessão do gestor (shared/auth) no formato que os componentes atuais já consomem. */
export function AuthProvider({ children }: AuthContextProps) {
  const sessao = useSession()
  // Evita novos objetos de contexto (e renderizações dos consumidores) enquanto a sessão não muda.
  const valor = useMemo<ValorAuth>(() => {
    const usuario: Usuario | null = sessao.session
      ? { id: sessao.session.user.id, nome: sessao.session.user.name, email: sessao.session.user.email, perfil: 'gestor', unidade: sessao.session.user.unitId }
      : null
    return {
      usuario,
      autenticado: sessao.status === 'authenticated',
      restaurando: sessao.status === 'restoring',
      sair: () => sessionManager.signOut('user'),
      temPerfil: (perfis) => usuario !== null && perfis.includes(usuario.perfil),
    }
  }, [sessao.session, sessao.status])

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
