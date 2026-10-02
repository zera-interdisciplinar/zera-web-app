import { ApiError } from '../types/api'
import type { ApiErroCorpo } from '../types/api'
import { sanitizarObjeto } from '../utils/sanitizacao'

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api'

interface OpcoesRequisicao {
  metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  corpo?: unknown
  sinal?: AbortSignal
}

export async function requisitar<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const { metodo = 'GET', corpo, sinal } = opcoes

  let resposta: Response
  try {
    resposta = await fetch(`${BASE_URL}${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
      signal: sinal,
    })
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') throw erro
    throw new ApiError('Não foi possível falar com o servidor do Zera. Verifique a rede.', 0)
  }

  if (!resposta.ok) {
    let mensagem = `Falha na requisição (HTTP ${resposta.status}).`
    let campo: string | undefined
    try {
      const corpoErro = (await resposta.json()) as ApiErroCorpo
      if (corpoErro?.mensagem) mensagem = corpoErro.mensagem
      campo = corpoErro?.campo
    } catch {
      mensagem = `Falha na requisição (HTTP ${resposta.status}).`
    }
    throw new ApiError(mensagem, resposta.status, campo)
  }

  if (resposta.status === 204) return undefined as T

  const dados = (await resposta.json()) as T
  return sanitizarObjeto(dados)
}

export function contextualizar(erro: unknown, contexto: string): unknown {
  if (erro instanceof DOMException && erro.name === 'AbortError') return erro
  if (erro instanceof ApiError) return new ApiError(`${contexto} ${erro.message}`, erro.status, erro.campo)
  return new ApiError(contexto, 0)
}
