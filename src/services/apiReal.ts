import { ApiError } from '../types/api'
import { sanitizarObjeto } from '../utils/sanitizacao'
import type { Pagina } from '../types/apiReal'

export const modoDemonstracao = import.meta.env.VITE_USE_MSW === 'true'

type Recurso = 'administrative' | 'inventory'

const bases: Record<Recurso, string | undefined> = {
  administrative: import.meta.env.VITE_ADMIN_API_URL || import.meta.env.VITE_API_BASE_URL,
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

export function obterSessaoApi(): { accessToken: string | null; unitId: string | null } {
  return { accessToken, unitId }
}

export interface OpcoesApiReal {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  corpo?: unknown
  sinal?: AbortSignal
  autenticada?: boolean
  unidade?: boolean
  diagnosticarFalhas?: boolean
}

export async function requisitarApiReal<T>(recurso: Recurso, caminho: string, opcoes: OpcoesApiReal = {}): Promise<T> {
  const base = bases[recurso]
  if (!base) {
    if (opcoes.diagnosticarFalhas && import.meta.env.DEV) {
      console.warn('[login] Falha de configuração', { url: '(base da API não configurada)', tipo: 'configuracao' })
    }
    const mensagem = recurso === 'administrative'
      ? 'A base do serviço de autenticação não está configurada.'
      : 'O serviço está indisponível.'
    throw new ApiError(mensagem, 0, undefined, 'configuracao')
  }
  const origem = typeof document === 'undefined' ? 'http://localhost/' : document.baseURI
  const baseNormalizada = base.replace(/\/+$/, '')
  const caminhoNormalizado = /\/api$/i.test(baseNormalizada) && /^\/api(?:\/|$)/i.test(caminho)
    ? caminho.replace(/^\/api/i, '')
    : caminho
  const url = new URL(`${baseNormalizada}${caminhoNormalizado}`, origem)
  const urlParaLog = () => {
    const segura = new URL(url)
    segura.username = ''
    segura.password = ''
    segura.search = ''
    segura.hash = ''
    return segura.toString()
  }
  const registrarFalha = (tipo: string) => {
    if (!opcoes.diagnosticarFalhas || !import.meta.env.DEV) return
    console.warn('[login] Falha na autenticação', {
      url: urlParaLog(),
      tipo,
    })
  }
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
    registrarFalha('rede')
    throw new ApiError('Não foi possível acessar a API. Verifique a conexão e a configuração.', 0, undefined, 'rede')
  }
  if (!resposta.ok) {
    registrarFalha('http')
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
    registrarFalha('resposta')
    throw new ApiError('A API retornou uma resposta inválida.', resposta.status, undefined, 'resposta')
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
