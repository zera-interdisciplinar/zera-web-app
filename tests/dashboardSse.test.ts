import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { randomUUID } from 'node:crypto'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { http } from 'msw'
import { setupServer } from 'msw/node'
import { analisarChunkSse, acompanharDashboard, criarUrlDashboardSse } from '../src/services/dashboardSse'
import { dashboardSnapshotMock, respostaSse } from '../src/mocks/dashboardSseFixture'
import { formatarErroDashboard, formatarNumero, formatarPontosPercentuais, formatarVariacao } from '../src/utils/formatarDashboard'
import { dashboardDemoEnabled } from '../src/config/dashboardMode'
import type { FiltrosDashboard } from '../src/types/dashboardAnalytics'
import { VisaoGeralTab } from '../src/components/DashboardTabs/VisaoGeralTab'
import { ItensVidaUtilTab } from '../src/components/DashboardTabs/ItensVidaUtilTab'
import { EvolucaoMovimentacoesTab } from '../src/components/DashboardTabs/EvolucaoMovimentacoesTab'
import { QualidadeDadosTab } from '../src/components/DashboardTabs/QualidadeDadosTab'
import { MateriaisSustentabilidadeTab } from '../src/components/DashboardTabs/MateriaisSustentabilidadeTab'
import { definirSessaoApi, observarExpiracaoSessao, obterSessaoApi } from '../src/services/apiReal'

const urlEndpoint = criarUrlDashboardSse({ period: '6m', view: 'todos' })
const endpoint = `${urlEndpoint.origin}${urlEndpoint.pathname}`
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => definirSessaoApi(randomUUID(), null))
afterEach(() => {
  server.resetHandlers()
  definirSessaoApi(null, null)
})
afterAll(() => server.close())

describe('parser SSE do dashboard', () => {
  it('recusa URL remota HTTP antes de transmitir a sessão', () => {
    expect(() => criarUrlDashboardSse({ period: '6m', view: 'todos' }, 'http://remote.example.invalid')).toThrow('conexão segura')
  })
  it('monta o endpoint a partir da base /api sem duplicar o prefixo', () => {
    const url = criarUrlDashboardSse(
      { period: '6m', view: 'todos' },
      'http://localhost:8000/api',
    )

    expect(url.toString()).toBe('http://localhost:8000/api/v1/dashboard/overview?period=6m&view=todos')
    expect(url.pathname.match(/\/api/g)).toHaveLength(1)
  })

  it('usa a base do proxy sem /api final e mantém exatamente o path do contrato', () => {
    const url = criarUrlDashboardSse({ period: '30d', view: 'pendentes', unitId: 'unit-1', responsible: 'user-1', q: 'notebook' }, 'https://web.example.invalid/api/analytics')
    expect(url.pathname).toBe('/api/analytics/api/v1/dashboard/overview')
    expect(url.searchParams.get('unit_id')).toBe('unit-1')
    expect(url.searchParams.get('responsible')).toBe('user-1')
    expect(url.searchParams.get('q')).toBe('notebook')
    expect(url.searchParams.has('access_token')).toBe(false)
  })
  it('processa CRLF dividido entre chunks, comentários e eventos nomeados', () => {
    const primeiro = analisarChunkSse('', 'event: snapshot\r')
    expect(primeiro.eventos).toEqual([])

    const segundo = analisarChunkSse(primeiro.restante, '\ndata: {"batch_id":"b1"}\r\n\r\n: heartbeat\n\n')
    expect(segundo.eventos).toEqual([{ event: 'snapshot', data: '{"batch_id":"b1"}' }])
    expect(segundo.restante).toBe('')
  })

  it('junta múltiplas linhas data com quebra de linha', () => {
    expect(analisarChunkSse('', 'event: error\ndata: {"detail":\ndata: "inválido"}\n\n').eventos)
      .toEqual([{ event: 'error', data: '{"detail":\n"inválido"}' }])
  })
})

describe('valores nulos do contrato', () => {
  it('não transforma nulos em zero nem em percentual enganoso', () => {
    expect(formatarNumero(null)).toBe('—')
    expect(formatarVariacao(null)).toBe('—')
    expect(formatarPontosPercentuais(null)).toBe('—')
  })

  it('mostra a mensagem de autorização definida para 403', () => {
    expect(formatarErroDashboard(403, 'negado')).toBe('Seu perfil não tem acesso a este painel.')
    expect(formatarErroDashboard(503, 'indisponível')).toBe('Não conseguimos carregar agora. Tente de novo em instantes.')
  })
})

describe('origem dos cards e gráficos', () => {
  const filtros: FiltrosDashboard = { period: '6m', view: 'todos' }

  it('após EOF troca para consultas de snapshot a cada 30 segundos, canceláveis', async () => {
    vi.useFakeTimers()
    const controle = new AbortController()
    let chamadas = 0
    const busca = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      chamadas += 1
      const lote = { ...dashboardSnapshotMock, batch_id: `poll-${chamadas}` }
      return new Response(new ReadableStream({ start(controller) {
        controller.enqueue(new TextEncoder().encode(`event: snapshot\ndata: ${JSON.stringify(lote)}\n\n`))
        if (chamadas === 1) controller.close()
      } }), { headers: { 'Content-Type': 'text/event-stream' } })
    })
    try {
      const tarefa = acompanharDashboard(filtros, controle.signal, { onSnapshot: () => { if (chamadas === 3) controle.abort() }, onUnavailable: vi.fn(), onError: vi.fn(), onState: vi.fn() })
      await vi.advanceTimersByTimeAsync(1000)
      expect(chamadas).toBe(2)
      await vi.advanceTimersByTimeAsync(29_999)
      expect(chamadas).toBe(2)
      await vi.advanceTimersByTimeAsync(1)
      await tarefa
      expect(chamadas).toBe(3)
    } finally { controle.abort(); busca.mockRestore(); vi.useRealTimers() }
  })

  it('exibe o selo em cada card/gráfico abastecido por fixture', () => {
    const visaoGeral = renderToStaticMarkup(createElement(VisaoGeralTab, { snapshot: dashboardSnapshotMock, demo: true }))
    const vidaUtil = renderToStaticMarkup(createElement(ItensVidaUtilTab, { demo: true, filtros }))
    const evolucao = renderToStaticMarkup(createElement(EvolucaoMovimentacoesTab, { demo: true, filtros }))
    const qualidade = renderToStaticMarkup(createElement(QualidadeDadosTab, { demo: true, filtros }))
    const materiais = renderToStaticMarkup(createElement(MateriaisSustentabilidadeTab, { demo: true, filtros }))

    for (const tela of [visaoGeral, vidaUtil, evolucao, qualidade, materiais]) {
      expect(tela.match(/<h2\b/g)?.length).toBeGreaterThan(0)
      expect(tela.match(/DEMONSTRAÇÃO/g)?.length).toBe(tela.match(/<h2\b/g)?.length)
    }
  })

  it('trata todos os percentuais nulos do contrato sem renderizar zero ou NaN', () => {
    const snapshotNulo = structuredClone(dashboardSnapshotMock)
    snapshotNulo.kpis.itens_cadastrados.change_percent = null
    snapshotNulo.kpis.taxa_reciclagem.percent = null
    snapshotNulo.kpis.taxa_reciclagem.change_points = null
    snapshotNulo.circularidade.percent = null

    const tela = renderToStaticMarkup(createElement(VisaoGeralTab, { snapshot: snapshotNulo, demo: true }))
    expect(tela).toContain('Variação: —')
    expect(tela).not.toContain('NaN')
    expect(tela).not.toContain('undefined')
    expect(tela).toContain('Circularidade: —')
  })

  it('não renderiza fixtures nem selos no modo real e identifica dados sem fonte', () => {
    const visaoGeral = renderToStaticMarkup(createElement(VisaoGeralTab, { snapshot: dashboardSnapshotMock, demo: false }))
    const vidaUtil = renderToStaticMarkup(createElement(ItensVidaUtilTab, { demo: false, filtros }))
    const evolucao = renderToStaticMarkup(createElement(EvolucaoMovimentacoesTab, { demo: false, filtros }))
    const qualidade = renderToStaticMarkup(createElement(QualidadeDadosTab, { demo: false, filtros }))
    const materiais = renderToStaticMarkup(createElement(MateriaisSustentabilidadeTab, { demo: false, filtros }))
    const telas = [visaoGeral, vidaUtil, evolucao, qualidade, materiais]

    expect(telas.join('')).not.toContain('DEMONSTRAÇÃO')
    expect(visaoGeral).not.toContain('Orbit Labs')
    expect(visaoGeral).not.toContain('Fixture MSW')
    expect(telas.join('')).toContain('Ainda não há dados para exibir aqui.')
    expect(vidaUtil).not.toContain('na seleção de demonstração')
    expect(evolucao).not.toContain('na seleção de demonstração')
  })

  it('só permite fixtures com MSW explicitamente ligado', () => {
    expect(dashboardDemoEnabled('true', 'true')).toBe(true)
    expect(dashboardDemoEnabled('false', 'true')).toBe(false)
    expect(dashboardDemoEnabled('true', 'false')).toBe(false)
    expect(dashboardDemoEnabled(undefined, 'false')).toBe(false)
    expect(dashboardDemoEnabled('true', '')).toBe(false)
  })
})

describe('integração MSW do stream', () => {
  const filtros: FiltrosDashboard = { period: '6m', view: 'todos' }

  it('aguarda preparação acima de 15 segundos sem abortar dados válidos', async () => {
    vi.useFakeTimers()
    let liberar: (resposta: Response) => void = () => {}
    let sinal: AbortSignal | null = null
    const busca = vi.spyOn(globalThis, 'fetch').mockImplementationOnce((_url, opcoes) => {
      sinal = opcoes?.signal ?? null
      return new Promise<Response>((resolve) => { liberar = resolve })
    })
    const controle = new AbortController()
    const snapshot = vi.fn(() => controle.abort())
    try {
      const tarefa = acompanharDashboard(filtros, controle.signal, { onSnapshot: snapshot, onUnavailable: vi.fn(), onError: vi.fn(), onState: vi.fn() })
      await vi.advanceTimersByTimeAsync(16_000)
      expect((sinal as AbortSignal | null)?.aborted).toBe(false)
      liberar(new Response(`event: snapshot\ndata: ${JSON.stringify(dashboardSnapshotMock)}\n\n`, { headers: { 'Content-Type': 'text/event-stream' } }))
      await tarefa
      expect(snapshot).toHaveBeenCalledOnce()
    } finally { busca.mockRestore(); vi.useRealTimers() }
  })

  it.each([401, 403, 503])('preserva HTTP %s e só expira sessão em 401', async (status) => {
    server.use(http.get(endpoint, () => Response.json({ detail: 'falha controlada' }, { status })))
    const expirou = vi.fn()
    const remover = observarExpiracaoSessao(expirou)
    const erro = vi.fn()
    try {
      await acompanharDashboard(filtros, new AbortController().signal, {
        onSnapshot: vi.fn(), onUnavailable: vi.fn(), onError: erro, onState: vi.fn(),
      })
      expect(erro).toHaveBeenCalledWith({ status, detail: 'falha controlada' })
      expect(expirou).toHaveBeenCalledTimes(status === 401 ? 1 : 0)
      expect(Boolean(obterSessaoApi().accessToken)).toBe(status !== 401)
    } finally { remover() }
  })

  it('recusa snapshot incompleto antes de entregar dados à tela', async () => {
    const fetchControlado = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('event: snapshot\ndata: {"batch_id":"invalido","kpis":{}}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    }))
    const snapshot = vi.fn()
    const erro = vi.fn()
    try {
      await acompanharDashboard(filtros, new AbortController().signal, {
        onSnapshot: snapshot, onUnavailable: vi.fn(), onError: erro, onState: vi.fn(),
      })
      expect(snapshot).not.toHaveBeenCalled()
      expect(erro).toHaveBeenCalledWith(expect.objectContaining({ status: 0, detail: expect.stringContaining('fora do contrato') }))
    } finally { fetchControlado.mockRestore() }
  })

  it('comunica falha de rede e permite cancelar antes da reconexão', async () => {
    server.use(http.get(endpoint, () => Response.error()))
    const controlador = new AbortController()
    const erro = vi.fn()
    await acompanharDashboard(filtros, controlador.signal, {
      onSnapshot: vi.fn(), onUnavailable: vi.fn(), onError: erro, onState: (estado) => { if (estado === 'reconnecting') controlador.abort() },
    })
    expect(erro).not.toHaveBeenCalled()
  })

  it('reabre o stream depois de EOF e recebe o novo lote', async () => {
    let chamadas = 0
    server.use(http.get(endpoint, () => {
      chamadas += 1
      const data = { ...dashboardSnapshotMock, batch_id: `lote-${chamadas}` }
      return chamadas === 1
        ? new Response(`event: snapshot\ndata: ${JSON.stringify(data)}\n\n`, { headers: { 'Content-Type': 'text/event-stream' } })
        : respostaSse('snapshot', data)
    }))
    const controlador = new AbortController()
    const batches: string[] = []
    const estado = vi.fn()
    await acompanharDashboard(filtros, controlador.signal, {
      onSnapshot(snapshot) { batches.push(snapshot.batch_id); if (batches.length === 2) controlador.abort() },
      onUnavailable: vi.fn(), onError: vi.fn(), onState: estado,
    })
    expect(batches).toEqual(['lote-1', 'lote-2'])
    expect(estado).toHaveBeenCalledWith('reconnecting')
  })

  it('aplica o snapshot e encerra a leitura ao cancelar', async () => {
    server.use(http.get(endpoint, () => respostaSse('snapshot', dashboardSnapshotMock)))
    const controlador = new AbortController()
    let batchId: string | undefined

    await acompanharDashboard(filtros, controlador.signal, {
      onSnapshot: (snapshot) => { batchId = snapshot.batch_id; controlador.abort() },
      onUnavailable: () => undefined,
      onError: () => undefined,
      onState: () => undefined,
    })

    expect(batchId).toBe(dashboardSnapshotMock.batch_id)
  })

  it('trata unavailable sem renderizar como stream quebrado', async () => {
    server.use(http.get(endpoint, () => respostaSse('unavailable', { detail: 'snapshot not ready' })))
    const controlador = new AbortController()
    let detalhe: string | undefined

    await acompanharDashboard(filtros, controlador.signal, {
      onSnapshot: () => undefined,
      onUnavailable: (valor) => { detalhe = valor; controlador.abort() },
      onError: () => undefined,
      onState: () => undefined,
    })

    expect(detalhe).toBe('snapshot not ready')
  })

  it('distingue o evento error da API e preserva status e detalhe', async () => {
    server.use(http.get(endpoint, () => respostaSse('error', { status: 400, detail: 'unit_id inválido' })))
    const controlador = new AbortController()
    let falha: { status: number; detail: string } | undefined

    await acompanharDashboard(filtros, controlador.signal, {
      onSnapshot: () => undefined,
      onUnavailable: () => undefined,
      onError: (valor) => { falha = valor; controlador.abort() },
      onState: () => undefined,
    })

    expect(falha).toEqual({ status: 400, detail: 'unit_id inválido' })
  })

  it('envia o JWT em Authorization e não inclui o token na URL', async () => {
    const accessToken = randomUUID()
    const erro = vi.fn()
    definirSessaoApi(accessToken, 'unidade-da-sessao')
    server.use(http.get(endpoint, ({ request }) => {
      const url = new URL(request.url)
      expect(request.headers.get('Authorization')).toBe(`Bearer ${accessToken}`)
      expect(request.headers.get('X-Unit-Id')).toBe('unidade-da-sessao')
      expect(url.searchParams.has('access_token')).toBe(false)
      expect(url.toString()).not.toContain(accessToken)
      return respostaSse('unavailable', { detail: 'snapshot not ready' })
    }))
    const controlador = new AbortController()

    await acompanharDashboard(filtros, controlador.signal, {
      onSnapshot: () => undefined,
      onUnavailable: () => controlador.abort(),
      onError: erro,
      onState: () => undefined,
    })
    expect(erro).not.toHaveBeenCalled()
  })
})
