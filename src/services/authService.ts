import type { Credenciais, SessaoAutenticada } from '../types/usuario'
import type { TokenResponse, UserOutput } from '../types/apiReal'
import { contextualizar, requisitar } from './http'
import { definirSessaoApi, modoDemonstracao, requisitarApiReal } from './apiReal'
import { ApiError } from '../types/api'

export async function autenticar(credenciais: Credenciais): Promise<SessaoAutenticada> {
  try {
    if (!modoDemonstracao) {
      definirSessaoApi(null, null)
      const token = await requisitarApiReal<TokenResponse>('administrative', '/api/v1/auth/login', {
        metodo: 'POST',
        corpo: { email: credenciais.email, password: credenciais.senha },
        autenticada: false,
        diagnosticarFalhas: true,
      })
      if (typeof token.accessToken !== 'string' || !token.accessToken.trim() || typeof token.userId !== 'string' || !token.userId.trim() || !Number.isFinite(token.expiresIn) || token.expiresIn <= 0 || !Number.isFinite(new Date(Date.now() + token.expiresIn * 1000).getTime())) throw new ApiError('Resposta de autenticação incompleta.', 0)
      definirSessaoApi(token.accessToken, null)
      try {
        const pessoa = await requisitarApiReal<UserOutput>('administrative', `/api/v1/users/${encodeURIComponent(token.userId)}`, {
          diagnosticarFalhas: true,
        })
        if (pessoa.role !== 'MANAGER' && pessoa.role !== 'EMPLOYEE') throw new ApiError('Perfil não previsto no contrato da API.', 403)
        if (pessoa.userId !== token.userId || typeof pessoa.name !== 'string' || typeof pessoa.email !== 'string' || typeof pessoa.unitId !== 'string' || !pessoa.unitId.trim()) throw new ApiError('Identidade incompleta ou incompatível com o login.', 0)
        definirSessaoApi(token.accessToken, pessoa.unitId)
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
    }
    const sessao = await requisitar<SessaoAutenticada>('/auth/login', {
      metodo: 'POST',
      corpo: credenciais,
    })
    return { ...sessao, demonstracao: true }
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível entrar.')
  }
}

export function mensagemErroLogin(erro: unknown): string {
  if (!(erro instanceof ApiError)) return 'Não foi possível concluir o login.'
  if (erro.message.includes('Perfil de demonstração inválido.')) return 'Perfil de demonstração inválido.'
  if (erro.status === 401 || erro.status === 403) return 'E-mail ou senha inválidos.'
  if (erro.tipoFalha === 'rede') return 'Servidor de autenticação indisponível. Tente novamente mais tarde.'
  if (erro.tipoFalha === 'configuracao') return 'Serviço de autenticação não configurado.'
  if (erro.status > 0) return `Erro ao entrar (código ${erro.status}).`
  return 'Resposta inválida do serviço de autenticação.'
}
