import type { SetStateAction } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ValorAuth } from '../context/auth'
import { definirSessaoApi, observarExpiracaoSessao } from '../services/apiReal'
import { autenticar, limparRenovacaoSessao, mensagemErroLogin, renovarSessao } from '../services/authService'
import { ApiError } from '../types/api'
import type { EstadoLocalSessaoAuth } from '../types/controles/EstadoLocalSessaoAuth'
import type { Credenciais, Perfil } from '../types/usuario'

export function useSessaoAuth() {
  const [estadoLocal, setEstadoLocal] = useState<EstadoLocalSessaoAuth>(() => ({
    usuario: null,
    entrando: false,
    erro: null,
    expiraEm: null,
  }))
  const { usuario, entrando, erro, expiraEm } = estadoLocal
  // Mantém os atualizadores estáveis para efeitos e consumidores do controle.
  const { setUsuario, setEntrando, setErro, setExpiraEm } = useMemo(() => ({
    setUsuario: (valor: SetStateAction<EstadoLocalSessaoAuth['usuario']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.usuario) : valor
      return Object.is(atual.usuario, proximo) ? atual : { ...atual, usuario: proximo }
    }),
    setEntrando: (valor: SetStateAction<EstadoLocalSessaoAuth['entrando']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.entrando) : valor
      return Object.is(atual.entrando, proximo) ? atual : { ...atual, entrando: proximo }
    }),
    setErro: (valor: SetStateAction<EstadoLocalSessaoAuth['erro']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.erro) : valor
      return Object.is(atual.erro, proximo) ? atual : { ...atual, erro: proximo }
    }),
    setExpiraEm: (valor: SetStateAction<EstadoLocalSessaoAuth['expiraEm']>) => setEstadoLocal(atual => {
      const proximo = typeof valor === 'function' ? valor(atual.expiraEm) : valor
      return Object.is(atual.expiraEm, proximo) ? atual : { ...atual, expiraEm: proximo }
    }),
  }), [])

  // Mantém a ação estável para os consumidores e efeitos que a recebem.
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
  }, [setEntrando, setErro, setExpiraEm, setUsuario])

  // Mantém a ação estável para os consumidores e efeitos que a recebem.
  const sair = useCallback(() => {
    limparRenovacaoSessao()
    definirSessaoApi(null, null)
    setUsuario(null)
    setExpiraEm(null)
  }, [setExpiraEm, setUsuario])

  useEffect(() => observarExpiracaoSessao(() => {
    sair()
    setErro('Sua sessão expirou. Entre novamente para continuar.')
  }), [sair, setErro])

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
  }, [expiraEm, sair, setErro, setExpiraEm])

  // Mantém a ação estável para os consumidores e efeitos que a recebem.
  const temPerfil = useCallback(
    (perfis: Perfil[]) => (usuario === null ? false : perfis.includes(usuario.perfil)),
    [usuario],
  )

  // Evita recalcular o valor enquanto suas dependências permanecem iguais.
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
  return { valor }
}
