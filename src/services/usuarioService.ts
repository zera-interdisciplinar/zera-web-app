import type { NovoUsuario, Usuario } from '../types/usuario'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao, requisitarApiReal } from './apiReal'
import { ehUsuarioApi } from '../utils/guardaUsuarioApi'
import { lerLista } from '../utils/guardasApi'

export async function listarUsuarios(sinal?: AbortSignal): Promise<Usuario[]> {
  try {
    if (!modoDemonstracao) {
      const dados = lerLista(await requisitarApiReal<unknown>('administrative', '/api/v1/users', { sinal }), ehUsuarioApi)
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
