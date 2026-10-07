import type { DashboardSnapshot, EventoSseDashboard, FiltrosDashboard } from '../types/dashboardAnalytics'
import { criarUrlApi, expirarSessaoApi, obterSessaoApi } from './apiReal'
import { ApiError } from '../types/api'

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api/analytics'
const CAMINHO_OVERVIEW = '/api/v1/dashboard/overview'

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
  // Base reservada apenas para resolver URLs relativas fora do navegador; não é chamada como serviço.
  const origem = typeof document === 'undefined' ? 'https://zera.invalid/' : document.baseURI
  const url = criarUrlApi(CAMINHO_OVERVIEW, new URL(baseUrl, origem).toString())
  const local = import.meta.env.DEV && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new ApiError('Não foi possível estabelecer uma conexão segura.', 0, undefined, 'configuracao')
  }
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
  const numero = (value: unknown) => typeof value === 'number' && Number.isFinite(value)
  const percentual = (value: unknown) => value === null || numero(value)
  const textos = (value: unknown) => Array.isArray(value) && value.every((item) => typeof item === 'string')
  const distribuicao = (value: unknown) => Array.isArray(value) && value.every((item) =>
    item !== null && typeof item === 'object' && typeof item.nome === 'string' && numero(item.quantidade) && percentual(item.percentual))
  return typeof snapshot.batch_id === 'string'
    && typeof snapshot.extracted_at === 'string'
    && typeof snapshot.organization?.id === 'string'
    && typeof snapshot.organization?.name === 'string'
    && numero(snapshot.kpis?.itens_cadastrados?.value)
    && percentual(snapshot.kpis?.itens_cadastrados?.change_percent)
    && percentual(snapshot.kpis?.taxa_reciclagem?.percent)
    && percentual(snapshot.kpis?.taxa_reciclagem?.change_points)
    && numero(snapshot.kpis?.aguardando_aprovacao?.value)
    && numero(snapshot.kpis?.aguardando_aprovacao?.prioritarios)
    && numero(snapshot.kpis?.impacto_recuperado?.kg)
    && numero(snapshot.kpis?.impacto_recuperado?.tonnes)
    && percentual(snapshot.circularidade?.percent)
    && numero(snapshot.alertas?.abertos)
    && Array.isArray(snapshot.alertas?.por_gravidade)
    && snapshot.alertas.por_gravidade.every((item) => item && typeof item.gravidade === 'string' && numero(item.quantidade))
    && distribuicao(snapshot.por_categoria)
    && distribuicao(snapshot.por_status)
    && Array.isArray(snapshot.itens_por_mes)
    && snapshot.itens_por_mes.every((item) => item && typeof item.mes === 'string' && numero(item.cadastrados) && numero(item.encaminhados))
    && textos(snapshot.available_filters?.categories)
    && textos(snapshot.available_filters?.statuses)
    && textos(snapshot.available_filters?.views)
    && textos(snapshot.available_filters?.periods)
    && Array.isArray(snapshot.available_filters?.units)
    && snapshot.available_filters.units.every((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
    && Array.isArray(snapshot.available_filters?.responsibles)
    && snapshot.available_filters.responsibles.every((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
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
  let consultaPeriodica = false

  while (!sinal.aborted) {
    let limiteDado: ReturnType<typeof setTimeout> | undefined
    let inatividade: ReturnType<typeof setTimeout> | undefined
    let recebeuDados = false
    opcoes.onState(falhasDeRede > 0 ? 'reconnecting' : 'connecting')
    try {
      const sessao = obterSessaoApi()
      if (!sessao.accessToken) {
        opcoes.onError({ status: 401, detail: 'Sessão expirada. Entre novamente.' })
        opcoes.onState('error')
        return
      }
      const headers = new Headers({ Accept: 'text/event-stream' })
      if (sessao.accessToken) headers.set('Authorization', `Bearer ${sessao.accessToken}`)
      const unidade = filtros.unitId ?? sessao.unitId
      if (unidade) headers.set('X-Unit-Id', unidade)

      const cancelamento = new AbortController()
      // A primeira resposta pode precisar preparar uma consulta ainda suspensa.
      limiteDado = setTimeout(() => cancelamento.abort(new DOMException('Tempo de preparação excedido.', 'TimeoutError')), 190_000)
      const resposta = await fetch(criarUrlDashboardSse(filtros), {
        method: 'GET',
        headers,
        signal: AbortSignal.any([sinal, cancelamento.signal]),
        credentials: 'omit',
        redirect: 'error',
        cache: 'no-store',
      })

      if (!resposta.ok) {
        if ([502, 503, 504].includes(resposta.status) && falhasDeRede < 2) {
          await resposta.text()
          falhasDeRede += 1
          opcoes.onState('reconnecting')
          await esperar(500 * 2 ** (falhasDeRede - 1), sinal)
          continue
        }
        const texto = await resposta.text()
        opcoes.onError(extrairFalha(resposta.status, texto))
        opcoes.onState('error')
        if (resposta.status === 401) expirarSessaoApi(sessao.accessToken)
        return
      }
      if (!resposta.headers.get('content-type')?.toLowerCase().includes('text/event-stream') || !resposta.body) {
        cancelamento.abort()
        opcoes.onError({ status: resposta.status, detail: 'O servidor não retornou um stream text/event-stream válido.' })
        opcoes.onState('error')
        return
      }

      const reader = resposta.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let terminal = false
      let concluirConsulta = false
      const cancelarLeitura = () => { void reader.cancel().catch(() => undefined) }
      sinal.addEventListener('abort', cancelarLeitura, { once: true })

      try {
        while (!sinal.aborted) {
          const { done, value } = await reader.read()
          if (done) break
          if (recebeuDados) {
            clearTimeout(inatividade)
            inatividade = setTimeout(() => cancelamento.abort(new DOMException('Atualização interrompida.', 'TimeoutError')), 65_000)
          }
          const resultado = analisarChunkSse(buffer, decoder.decode(value, { stream: true }))
          buffer = resultado.restante
          for (const evento of resultado.eventos) {
            if (!['snapshot', 'unavailable', 'error'].includes(evento.event)) continue
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
              clearTimeout(limiteDado)
              recebeuDados = true
              falhasDeRede = 0
              opcoes.onState('connected')
              opcoes.onSnapshot(corpo)
              clearTimeout(inatividade)
              inatividade = setTimeout(() => cancelamento.abort(new DOMException('Atualização interrompida.', 'TimeoutError')), 65_000)
              if (consultaPeriodica) { concluirConsulta = true; break }
            } else if (evento.event === 'unavailable' && typeof (corpo as { detail?: unknown })?.detail === 'string') {
              clearTimeout(limiteDado)
              recebeuDados = true
              falhasDeRede = 0
              opcoes.onUnavailable((corpo as { detail: string }).detail)
              opcoes.onState('unavailable')
              clearTimeout(inatividade)
              inatividade = setTimeout(() => cancelamento.abort(new DOMException('Atualização interrompida.', 'TimeoutError')), 65_000)
              if (consultaPeriodica) { concluirConsulta = true; break }
            } else if (evento.event === 'error') {
              const falha = corpo as { status?: unknown; detail?: unknown } | null
              opcoes.onError({
                status: typeof falha?.status === 'number' ? falha.status : 0,
                detail: typeof falha?.detail === 'string' ? falha.detail : 'O BFF encerrou o stream com erro.',
              })
              opcoes.onState('error')
              if (falha?.status === 401) expirarSessaoApi(sessao.accessToken)
              terminal = true
              break
            } else if (evento.event === 'snapshot') {
              opcoes.onError({ status: 0, detail: 'O BFF enviou um snapshot fora do contrato esperado.' })
              opcoes.onState('error')
              terminal = true
              break
            }
          }
          if (terminal || concluirConsulta) break
        }
      } finally {
        sinal.removeEventListener('abort', cancelarLeitura)
        cancelamento.abort()
        await reader.cancel().catch(() => undefined)
        reader.releaseLock()
      }

      if (terminal || sinal.aborted) return
      // A mesma rota fornece um snapshot por consulta; não se inventa outra API.
      const jaConsultava = consultaPeriodica
      if (recebeuDados) consultaPeriodica = true
      if (jaConsultava && recebeuDados) {
        await esperar(30_000, sinal)
        continue
      }
      falhasDeRede += 1
      if (falhasDeRede >= 3) {
        opcoes.onError({ status: 0, detail: 'Não recebemos dados para atualizar o painel. Tente novamente.' })
        opcoes.onState('error')
        return
      }
    } catch (erro) {
      if (sinal.aborted) return
      if (erro instanceof ApiError && erro.tipoFalha === 'configuracao') {
        opcoes.onError({ status: 0, detail: erro.message })
        opcoes.onState('error')
        return
      }
      if (recebeuDados) consultaPeriodica = true
      falhasDeRede += 1
      if (falhasDeRede >= 3) {
        opcoes.onError({ status: 0, detail: 'Não conseguimos atualizar os dados. Tente novamente.' })
        opcoes.onState('error')
        return
      }
      if (import.meta.env.DEV) console.warn('[Zera] Consulta interrompida', { tipo: erro instanceof Error ? erro.name : 'rede' })
    } finally {
      clearTimeout(limiteDado)
      clearTimeout(inatividade)
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
