import { ApiError } from '../types/api'
import { sanitizarObjeto } from '../utils/sanitizacao'
import type { Pagina } from '../types/apiReal'

export const modoDemonstracao = import.meta.env.VITE_USE_MSW === 'true'

type Recurso = 'administrative' | 'inventory'

const bases: Record<Recurso, string | undefined> = {
  administrative: import.meta.env.VITE_ADMIN_API_URL,
  inventory: import.meta.env.VITE_INVENTORY_API_URL,
}

let accessToken: string | null = null
let unitId: string | null = null
const aoExpirar = new Set<() => void>()

export function observarExpiracaoSessao(observador: () => void): () => void {
  aoExpirar.add(observador)
  return () => { aoExpirar.delete(observador) }
}

export function definirSessaoApi(token: string | null, unidade: string | null) {
  accessToken = token
  unitId = unidade
}

export interface OpcoesApiReal {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  corpo?: unknown
  sinal?: AbortSignal
  autenticada?: boolean
  unidade?: boolean
}

export async function requisitarApiReal<T>(recurso: Recurso, caminho: string, opcoes: OpcoesApiReal = {}): Promise<T> {
  const base = bases[recurso]
  if (!base) throw new ApiError('O serviço está indisponível. Entre em contato com a equipe responsável pelo ZERA.', 0)
  const origem = typeof document === 'undefined' ? 'http://localhost/' : document.baseURI
  const url = new URL(`${base.replace(/\/$/, '')}${caminho}`, origem)
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(import.meta.env.DEV && local && url.protocol === 'http:')) {
    throw new ApiError('API remota sem HTTPS. Credenciais e dados não serão enviados por HTTP.', 0)
  }
  if (opcoes.autenticada !== false && !accessToken) throw new ApiError('Sessão expirada. Entre novamente.', 401)
  if (opcoes.unidade && !unitId) throw new ApiError('A conta não possui unidade de inventário.', 0)
  const tokenDaRequisicao = accessToken

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opcoes.corpo !== undefined) headers['Content-Type'] = 'application/json'
  if (opcoes.autenticada !== false && accessToken) headers.Authorization = `Bearer ${accessToken}`
  if (opcoes.unidade && unitId) headers['X-Unit-Id'] = unitId

  let resposta: Response
  try {
    resposta = await fetch(url, {
      method: opcoes.metodo ?? 'GET',
      headers,
      body: opcoes.corpo === undefined ? undefined : JSON.stringify(opcoes.corpo),
      signal: opcoes.sinal,
      credentials: 'omit',
      redirect: 'error',
    })
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro
    throw new ApiError('Não foi possível acessar a API. Verifique a conexão e a configuração.', 0)
  }
  if (!resposta.ok) {
    if (resposta.status === 401 && opcoes.autenticada !== false && accessToken === tokenDaRequisicao) {
      definirSessaoApi(null, null)
      aoExpirar.forEach((observador) => observador())
    }
    const mensagem = resposta.status === 403
      ? 'Sua conta não tem permissão para esta operação.'
      : resposta.status === 401 ? 'Sessão inválida. Entre novamente.' : `A API retornou HTTP ${resposta.status}.`
    throw new ApiError(mensagem, resposta.status)
  }
  if (resposta.status === 204) return undefined as T
  try {
    return sanitizarObjeto((await resposta.json()) as T)
  } catch {
    throw new ApiError('A API retornou uma resposta inválida.', resposta.status)
  }
}

export async function listarPaginas<T>(recurso: Recurso, caminho: string, sinal?: AbortSignal): Promise<T[]> {
  const itens: T[] = []
  let pagina = 0
  let total = 1
  while (pagina < total) {
    const separador = caminho.includes('?') ? '&' : '?'
    const resposta = await requisitarApiReal<Pagina<T>>(recurso, `${caminho}${separador}page=${pagina}&size=20`, { sinal, unidade: recurso === 'inventory' })
    if (!Array.isArray(resposta.content) || !Number.isInteger(resposta.totalPages) || resposta.totalPages < 0) {
      throw new ApiError('Paginação inválida recebida da API.', 0)
    }
    itens.push(...resposta.content)
    total = resposta.totalPages
    pagina += 1
    if (pagina > 1000) throw new ApiError('A lista excede o limite seguro de paginação.', 0)
  }
  return itens
}
