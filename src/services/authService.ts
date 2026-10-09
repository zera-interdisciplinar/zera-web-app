import type { Credenciais, SessaoAutenticada } from '../types/usuario'
import type { TokenResponse } from '../types/apiReal'
import { contextualizar, requisitar } from './http'
import { definirSessaoApi, modoDemonstracao, obterSessaoApi, requisitarApiReal } from './apiReal'
import { ApiError } from '../types/api'
import { ehObjeto, ehTexto, ehNumeroFinito } from '../utils/guardasApi'
import { ehUsuarioApi } from '../utils/guardaUsuarioApi'

function ehTokenApi(valor: unknown): valor is TokenResponse {
  return ehObjeto(valor) && ehTexto(valor.userId) && Boolean(valor.userId.trim())
    && ehTexto(valor.accessToken) && Boolean(valor.accessToken.trim())
    && ehTexto(valor.refreshToken) && Boolean(valor.refreshToken.trim())
    && ehTexto(valor.tokenType) && Boolean(valor.tokenType.trim())
    && ehNumeroFinito(valor.expiresIn) && valor.expiresIn > 0
    && Number.isFinite(new Date(Date.now() + valor.expiresIn * 1000).getTime())
}

let refreshToken: string | null = null

export function limparRenovacaoSessao() {
  refreshToken = null
}

export async function renovarSessao(): Promise<string> {
  const sessao = obterSessaoApi()
  const anterior = refreshToken
  if (!anterior || !sessao.accessToken) throw new ApiError('Sessão expirada. Entre novamente.', 401)
  const token = await requisitarApiReal<unknown>('administrative', '/api/v1/auth/refresh', {
    metodo: 'POST', corpo: { refreshToken: anterior }, autenticada: false,
  })
  if (obterSessaoApi().accessToken !== sessao.accessToken || refreshToken !== anterior) {
    throw new DOMException('Sessão substituída.', 'AbortError')
  }
  if (!ehTokenApi(token)) throw new ApiError('Resposta de renovação incompleta. Tente novamente.', 0)
  refreshToken = token.refreshToken
  definirSessaoApi(token.accessToken, sessao.unitId)
  return new Date(Date.now() + token.expiresIn * 1000).toISOString()
}

export async function autenticar(credenciais: Credenciais): Promise<SessaoAutenticada> {
  try {
    limparRenovacaoSessao()
    definirSessaoApi(null, null)
    if (modoDemonstracao) return { ...await requisitar<SessaoAutenticada>('/auth/login', { metodo: 'POST', corpo: credenciais }), demonstracao: true }
    const token = await requisitarApiReal<unknown>('administrative', '/api/v1/auth/login', {
        metodo: 'POST',
        corpo: { email: credenciais.email, password: credenciais.senha },
        autenticada: false,
        diagnosticarFalhas: true,
    })
    if (!ehTokenApi(token)) throw new ApiError('Resposta de autenticação incompleta. Tente novamente.', 0)
    definirSessaoApi(token.accessToken, null)
    try {
        const pessoa = await requisitarApiReal<unknown>('administrative', `/api/v1/users/${encodeURIComponent(token.userId)}`, {
          diagnosticarFalhas: true,
        })
        if (ehObjeto(pessoa) && pessoa.role !== 'MANAGER' && pessoa.role !== 'EMPLOYEE') throw new ApiError('Perfil não previsto no contrato da API.', 403)
        if (!ehUsuarioApi(pessoa) || pessoa.userId !== token.userId) throw new ApiError('Identidade incompleta ou incompatível com o login. Tente novamente.', 0)
        definirSessaoApi(token.accessToken, pessoa.unitId)
        refreshToken = typeof token.refreshToken === 'string' && token.refreshToken.trim() ? token.refreshToken : null
        return {
          usuario: {
            id: pessoa.userId,
            nome: pessoa.name,
            email: pessoa.email,
            perfil: pessoa.role === 'MANAGER' ? 'gestor' : 'funcionario',
            unidade: pessoa.unitId,
          },
          expiraEm: new Date(Date.now() + token.expiresIn * 1000).toISOString(),
        }
    } catch (erro) {
      definirSessaoApi(null, null)
      throw erro
    }
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível entrar.')
  }
}

export function mensagemErroLogin(erro: unknown): string {
  if (!(erro instanceof ApiError)) return 'Não foi possível concluir o login.'
  if (modoDemonstracao && erro.message.includes('Perfil de demonstração inválido.')) return 'Perfil de demonstração inválido.'
  if (erro.status === 401 || erro.status === 403) return 'E-mail ou senha inválidos.'
  if (erro.tipoFalha === 'rede' || erro.status >= 500) return 'Servidor de autenticação indisponível. Tente novamente mais tarde.'
  if (erro.tipoFalha === 'configuracao') return 'Serviço de autenticação não configurado.'
  if (erro.status > 0) return `Erro ao entrar (código ${erro.status}).`
  return 'Resposta inválida do serviço de autenticação.'
}
