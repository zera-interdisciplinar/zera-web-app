import type { NovoUsuario, Usuario } from '../types/usuario'
import { contextualizar, requisitar } from './http'
import { modoDemonstracao, requisitarApiReal } from './apiReal'
import { ehUsuarioApi } from '../utils/guardaUsuarioApi'
import { lerLista } from '../utils/guardasApi'

const cacheNomesUsuarios = new Map<string, Promise<string | null>>()

export function limparCacheNomesUsuarios(): void {
  cacheNomesUsuarios.clear()
}

export function buscarNomeUsuario(id: string): Promise<string | null> {
  const usuarioId = id.trim()
  if (!usuarioId) return Promise.resolve(null)

  const nomeEmCache = cacheNomesUsuarios.get(usuarioId)
  if (nomeEmCache) return nomeEmCache

  const consulta = (async (): Promise<string | null> => {
    try {
      const pessoa = await requisitarApiReal<unknown>(
        'administrative',
        `/api/v1/users/${encodeURIComponent(usuarioId)}`,
      )
      if (!ehUsuarioApi(pessoa) || pessoa.userId !== usuarioId) return null
      return pessoa.name.trim() || null
    } catch {
      return null
    }
  })()

  cacheNomesUsuarios.set(usuarioId, consulta)
  return consulta
}

export async function buscarNomesUsuarios(ids: readonly string[]): Promise<Map<string, string>> {
  const unicos = [...new Set(ids.map((id) => id.trim()).filter(Boolean))]
  const resultados = await Promise.all(unicos.map(async (id) => [id, await buscarNomeUsuario(id)] as const))
  return new Map(resultados.filter((resultado): resultado is readonly [string, string] => resultado[1] !== null))
}

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
