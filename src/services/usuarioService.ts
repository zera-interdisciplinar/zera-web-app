import type { NovoUsuario, Usuario } from '../types/usuario'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao, requisitarApiReal } from './apiReal'
import type { UserOutput } from '../types/apiReal'

export async function listarUsuarios(sinal?: AbortSignal): Promise<Usuario[]> {
  try {
    if (!modoDemonstracao) {
      const dados = await requisitarApiReal<UserOutput[]>('administrative', '/api/v1/users', { sinal })
      if (dados.some((pessoa) => pessoa.role !== 'MANAGER' && pessoa.role !== 'EMPLOYEE')) throw new Error('Perfil não previsto no contrato da API.')
      return dados.map((pessoa) => ({
        id: pessoa.userId,
        nome: pessoa.name,
        email: pessoa.email,
        perfil: pessoa.role === 'MANAGER' ? 'gestor' as const : 'funcionario' as const,
        unidade: pessoa.unitId,
      }))
    }
    return await requisitar<Usuario[]>('/users', { sinal })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível carregar os funcionários.')
  }
}

export async function criarUsuario(novo: NovoUsuario): Promise<Usuario> {
  try {
    if (!modoDemonstracao) throw new Error('A API usa convites e não documenta POST /users. Cadastro direto indisponível.')
    return await requisitar<Usuario>('/users', { metodo: 'POST', corpo: novo })
  } catch (erro) {
    throw contextualizar(erro, 'Não foi possível cadastrar o funcionário.')
  }
}
