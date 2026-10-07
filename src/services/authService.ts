import type { Credenciais, Perfil, SessaoAutenticada } from '../types/usuario'
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
      })
      if (typeof token.accessToken !== 'string' || !token.accessToken.trim() || typeof token.userId !== 'string' || !token.userId.trim() || !Number.isFinite(token.expiresIn) || token.expiresIn <= 0 || !Number.isFinite(new Date(Date.now() + token.expiresIn * 1000).getTime())) throw new ApiError('Resposta de autenticação incompleta.', 0)
      definirSessaoApi(token.accessToken, null)
      try {
        const pessoa = await requisitarApiReal<UserOutput>('administrative', `/api/v1/users/${encodeURIComponent(token.userId)}`)
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
    return await requisitar<SessaoAutenticada>('/auth/login', {
      metodo: 'POST',
      corpo: credenciais,
    })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível entrar.')
  }
}

export async function abrirDemonstracao(perfil: Perfil): Promise<SessaoAutenticada> {
  if (!modoDemonstracao) throw new ApiError('A demonstração está desativada neste ambiente.', 403)
  try {
    return await requisitar<SessaoAutenticada>('/auth/demo', { metodo: 'POST', corpo: { perfil } })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível abrir a demonstração.')
  }
}
