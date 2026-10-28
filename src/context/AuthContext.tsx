import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { autenticar, limparRenovacaoSessao, mensagemErroLogin, renovarSessao } from '../services/authService'
import { definirSessaoApi, observarExpiracaoSessao } from '../services/apiReal'
import type { Credenciais, Perfil, Usuario } from '../types/usuario'
import { ApiError } from '../types/api'
import { AuthContext } from './auth'
import type { ValorAuth } from './auth'

interface Props {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [expiraEm, setExpiraEm] = useState<string | null>(null)

  const entrar = useCallback(async (credenciais: Credenciais): Promise<'autenticado' | 'credenciais-invalidas' | 'falha'> => {
    setEntrando(true)
    setErro(null)
    try {
      const sessao = await autenticar(credenciais)
      setUsuario(sessao.usuario)
      setExpiraEm(sessao.expiraEm)
      return 'autenticado'
    } catch (falha) {
      const credenciaisInvalidas = falha instanceof ApiError && (falha.status === 401 || falha.status === 403)
      setErro(mensagemErroLogin(falha))
      return credenciaisInvalidas ? 'credenciais-invalidas' : 'falha'
    } finally {
      setEntrando(false)
    }
  }, [])

  const sair = useCallback(() => {
    limparRenovacaoSessao()
    definirSessaoApi(null, null)
    setUsuario(null)
    setExpiraEm(null)
  }, [])

  useEffect(() => observarExpiracaoSessao(() => {
    sair()
    setErro('Sua sessão expirou. Entre novamente para continuar.')
  }), [sair])

  useEffect(() => {
    if (!expiraEm) return
    let ativo = true
    const restante = Date.parse(expiraEm) - Date.now()
    const renovar = async () => {
      try {
        const validade = await renovarSessao()
        if (ativo) setExpiraEm(validade)
      } catch {
        if (ativo) {
          sair()
          setErro('Sua sessão expirou. Entre novamente para continuar.')
        }
      }
    }
    const antecedencia = Math.min(30_000, Math.max(0, restante / 2))
    const temporizador = window.setTimeout(() => { void renovar() }, Math.max(0, Math.min(restante - antecedencia, 2_147_483_647)))
    return () => { ativo = false; window.clearTimeout(temporizador) }
  }, [expiraEm, sair])

  const temPerfil = useCallback(
    (perfis: Perfil[]) => (usuario === null ? false : perfis.includes(usuario.perfil)),
    [usuario],
  )

  const valor = useMemo<ValorAuth>(
    () => ({
      usuario,
      autenticado: usuario !== null,
      entrando,
      erro,
      entrar,
      sair,
      temPerfil,
    }),
    [usuario, entrando, erro, entrar, sair, temPerfil],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
