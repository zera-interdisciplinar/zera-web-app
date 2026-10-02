import type { Credenciais, SessaoAutenticada } from '../types/usuario'
import type { TokenResponse, UserOutput } from '../types/apiReal'
import { contextualizar, requisitar } from './http'
import { definirSessaoApi, modoDemonstracao, requisitarApiReal } from './apiReal'

export async function autenticar(credenciais: Credenciais): Promise<SessaoAutenticada> {
  try {
    if (!modoDemonstracao) {
      const token = await requisitarApiReal<TokenResponse>('administrative', '/api/v1/auth/login', {
        metodo: 'POST',
        corpo: { email: credenciais.email, password: credenciais.senha },
        autenticada: false,
      })
      if (!token.accessToken || !token.userId || !Number.isFinite(token.expiresIn) || token.expiresIn <= 0) throw new Error('Resposta de autenticação incompleta.')
      definirSessaoApi(token.accessToken, null)
      try {
        const pessoa = await requisitarApiReal<UserOutput>('administrative', `/api/v1/users/${encodeURIComponent(token.userId)}`)
        if (pessoa.role !== 'MANAGER' && pessoa.role !== 'EMPLOYEE') throw new Error('Perfil não previsto no contrato da API.')
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
