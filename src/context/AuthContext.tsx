import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { abrirDemonstracao, autenticar } from '../services/authService'
import { definirSessaoApi, modoDemonstracao, observarExpiracaoSessao } from '../services/apiReal'
import type { Credenciais, Perfil, Usuario } from '../types/usuario'
import { mensagemDeErro } from '../types/api'
import { CHAVE_SESSAO, carregar, remover, salvar } from '../utils/storage'
import { AuthContext } from './auth'
import type { ValorAuth } from './auth'

interface SessaoPersistida {
  usuario: Usuario
  expiraEm: string
}

const migracoes = {
  1: (): SessaoPersistida | null => null,
}

interface Props {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    if (!modoDemonstracao) return null
    const sessao = carregar<SessaoPersistida>(CHAVE_SESSAO, migracoes)
    if (!sessao) return null
    if (new Date(sessao.expiraEm).getTime() <= Date.now()) {
      remover(CHAVE_SESSAO)
      return null
    }
    return sessao.usuario
  })
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [expiraEm, setExpiraEm] = useState(() => modoDemonstracao ? carregar<SessaoPersistida>(CHAVE_SESSAO, migracoes)?.expiraEm ?? null : null)

  const entrar = useCallback(async (credenciais: Credenciais): Promise<boolean> => {
    setEntrando(true)
    setErro(null)
    try {
      const sessao = await autenticar(credenciais)
      if (modoDemonstracao) salvar<SessaoPersistida>(CHAVE_SESSAO, sessao)
      setUsuario(sessao.usuario)
      setExpiraEm(sessao.expiraEm)
      return true
    } catch (falha) {
      setErro(mensagemDeErro(falha))
      return false
    } finally {
      setEntrando(false)
    }
  }, [])

  const explorar = useCallback(async (perfil: Perfil): Promise<boolean> => {
    setEntrando(true)
    setErro(null)
    try {
      const sessao = await abrirDemonstracao(perfil)
      salvar<SessaoPersistida>(CHAVE_SESSAO, sessao)
      setUsuario(sessao.usuario)
      setExpiraEm(sessao.expiraEm)
      return true
    } catch (falha) {
      setErro(mensagemDeErro(falha))
      return false
    } finally {
      setEntrando(false)
    }
  }, [])

  const sair = useCallback(() => {
    definirSessaoApi(null, null)
    remover(CHAVE_SESSAO)
    setUsuario(null)
    setExpiraEm(null)
  }, [])

  useEffect(() => observarExpiracaoSessao(() => {
    sair()
    setErro('Sua sessão expirou. Entre novamente para continuar.')
  }), [sair])

  useEffect(() => {
    if (!expiraEm) return
    const restante = Date.parse(expiraEm) - Date.now()
    const temporizador = window.setTimeout(sair, Math.max(0, Math.min(restante, 2_147_483_647)))
    return () => window.clearTimeout(temporizador)
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
      explorar,
      sair,
      temPerfil,
    }),
    [usuario, entrando, erro, entrar, explorar, sair, temPerfil],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
