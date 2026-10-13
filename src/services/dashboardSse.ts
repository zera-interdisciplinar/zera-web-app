import type { DashboardSnapshot, EventoSseDashboard, FiltrosDashboard } from '../types/dashboardAnalytics'
import { obterSessaoApi } from './apiReal'

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api'
const CAMINHO_OVERVIEW = '/v1/dashboard/overview'

export interface FalhaDashboard {
  status: number
  detail: string
}

export type EstadoConexaoDashboard = 'connecting' | 'connected' | 'reconnecting' | 'unavailable' | 'error'

export interface OpcoesStreamDashboard {
  onSnapshot: (snapshot: DashboardSnapshot) => void
  onUnavailable: (detail: string) => void
  onError: (error: FalhaDashboard) => void
  onState: (state: EstadoConexaoDashboard) => void
}

export function criarUrlDashboardSse(filtros: FiltrosDashboard, baseUrl = API_BASE_URL): URL {
  const url = new URL(`${baseUrl.replace(/\/$/, '')}${CAMINHO_OVERVIEW}`,
    typeof document === 'undefined' ? 'http://localhost/' : document.baseURI)
  url.searchParams.set('period', filtros.period)
  url.searchParams.set('view', filtros.view)

  if (filtros.from && filtros.to) {
    url.searchParams.set('from', filtros.from)
    url.searchParams.set('to', filtros.to)
  }
  if (filtros.category) url.searchParams.set('category', filtros.category)
  if (filtros.status) url.searchParams.set('status', filtros.status)
  if (filtros.unitId) url.searchParams.set('unit_id', filtros.unitId)
  if (filtros.responsible) url.searchParams.set('responsible', filtros.responsible)
  if (filtros.q) url.searchParams.set('q', filtros.q)
  return url
}

interface EventoSseCru {
  event: string
  data: string
}

function decodificarBloco(bloco: string): EventoSseCru | null {
  let event = 'message'
  const data: string[] = []

  for (const linha of bloco.split('\n')) {
    if (!linha || linha.startsWith(':')) continue
    const separador = linha.indexOf(':')
    const campo = separador < 0 ? linha : linha.slice(0, separador)
    const valor = separador < 0 ? '' : linha.slice(separador + 1).replace(/^ /, '')
    if (campo === 'event') event = valor
    if (campo === 'data') data.push(valor)
  }

  if (data.length === 0) return null
  return { event, data: data.join('\n') }
}

/** Recebe blocos arbitrários do ReadableStream e preserva o evento incompleto. */
export function analisarChunkSse(buffer: string, chunk: string): { eventos: EventoSseCru[]; restante: string } {
  const combinado = `${buffer}${chunk}`
  const terminaComCr = combinado.endsWith('\r')
  const normalizado = combinado.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\uFEFF/, '')
  const texto = terminaComCr ? normalizado.slice(0, -1) : normalizado
  const blocos = texto.split('\n\n')
  const restante = `${blocos.pop() ?? ''}${terminaComCr ? '\r' : ''}`
  const eventos = blocos.map(decodificarBloco).filter((evento): evento is EventoSseCru => evento !== null)
  return { eventos, restante }
}

function extrairFalha(httpStatus: number, texto: string): FalhaDashboard {
  try {
    const corpo = JSON.parse(texto) as { detail?: unknown }
    if (typeof corpo.detail === 'string') return { status: httpStatus, detail: corpo.detail }
  } catch {
    // Respostas de gateways podem não ser JSON.
  }
  return { status: httpStatus, detail: `Falha HTTP ${httpStatus} ao abrir o dashboard.` }
}

function validarSnapshot(valor: unknown): valor is DashboardSnapshot {
  if (typeof valor !== 'object' || valor === null) return false
  const snapshot = valor as Partial<DashboardSnapshot>
  return typeof snapshot.batch_id === 'string'
    && typeof snapshot.extracted_at === 'string'
    && typeof snapshot.organization?.name === 'string'
    && typeof snapshot.kpis?.itens_cadastrados?.value === 'number'
    && Array.isArray(snapshot.itens_por_mes)
}

function esperar(ms: number, sinal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (sinal.aborted) return resolve()
    const finalizar = () => {
      clearTimeout(id)
      sinal.removeEventListener('abort', finalizar)
      resolve()
    }
    const id = setTimeout(finalizar, ms)
    sinal.addEventListener('abort', finalizar, { once: true })
  })
}

export async function acompanharDashboard(
  filtros: FiltrosDashboard,
  sinal: AbortSignal,
  opcoes: OpcoesStreamDashboard,
): Promise<void> {
  let falhasDeRede = 0

  while (!sinal.aborted) {
    opcoes.onState(falhasDeRede > 0 ? 'reconnecting' : 'connecting')
    try {
      const sessao = obterSessaoApi()
      const headers = new Headers({ Accept: 'text/event-stream' })
      if (sessao.accessToken) headers.set('Authorization', `Bearer ${sessao.accessToken}`)
      if (filtros.unitId) headers.set('X-Unit-Id', filtros.unitId)

      const resposta = await fetch(criarUrlDashboardSse(filtros), {
        method: 'GET',
        headers,
        signal: sinal,
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store',
      })

      if (!resposta.ok) {
        const texto = await resposta.text().catch(() => '')
        opcoes.onError(extrairFalha(resposta.status, texto))
        opcoes.onState('error')
        return
      }
      if (!resposta.headers.get('content-type')?.toLowerCase().includes('text/event-stream') || !resposta.body) {
        opcoes.onError({ status: resposta.status, detail: 'O servidor não retornou um stream text/event-stream válido.' })
        opcoes.onState('error')
        return
      }

      falhasDeRede = 0
      opcoes.onState('connected')
      const reader = resposta.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let terminal = false
      const cancelarLeitura = () => { void reader.cancel().catch(() => undefined) }
      sinal.addEventListener('abort', cancelarLeitura, { once: true })

      try {
        while (!sinal.aborted) {
          const { done, value } = await reader.read()
          if (done) break
          const resultado = analisarChunkSse(buffer, decoder.decode(value, { stream: true }))
          buffer = resultado.restante
          for (const evento of resultado.eventos) {
            let corpo: unknown
            try {
              corpo = JSON.parse(evento.data)
            } catch {
              opcoes.onError({ status: 0, detail: 'O stream enviou um evento com JSON inválido.' })
              opcoes.onState('error')
              terminal = true
              break
            }

            if (evento.event === 'snapshot' && validarSnapshot(corpo)) {
              opcoes.onSnapshot(corpo)
            } else if (evento.event === 'unavailable' && typeof (corpo as { detail?: unknown })?.detail === 'string') {
              opcoes.onUnavailable((corpo as { detail: string }).detail)
              opcoes.onState('unavailable')
            } else if (evento.event === 'error') {
              const falha = corpo as { status?: unknown; detail?: unknown }
              opcoes.onError({
                status: typeof falha.status === 'number' ? falha.status : 0,
                detail: typeof falha.detail === 'string' ? falha.detail : 'O BFF encerrou o stream com erro.',
              })
              opcoes.onState('error')
              terminal = true
              break
            } else if (evento.event === 'snapshot') {
              opcoes.onError({ status: 0, detail: 'O BFF enviou um snapshot fora do contrato esperado.' })
              opcoes.onState('error')
              terminal = true
              break
            }
          }
          if (terminal) break
        }
      } finally {
        sinal.removeEventListener('abort', cancelarLeitura)
        await reader.cancel().catch(() => undefined)
        reader.releaseLock()
      }

      if (terminal || sinal.aborted) return
      falhasDeRede += 1
    } catch (erro) {
      if (sinal.aborted || (erro instanceof DOMException && erro.name === 'AbortError')) return
      falhasDeRede += 1
    }

    if (!sinal.aborted) {
      opcoes.onState('reconnecting')
      await esperar(Math.min(1000 * 2 ** Math.min(falhasDeRede - 1, 4), 15000), sinal)
    }
  }
}

export function ehEventoDashboard(evento: EventoSseDashboard): boolean {
  return evento.event === 'snapshot' || evento.event === 'unavailable' || evento.event === 'error'
}
