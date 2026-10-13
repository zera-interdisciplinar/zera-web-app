import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { randomUUID } from 'node:crypto'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { http } from 'msw'
import { setupServer } from 'msw/node'
import { analisarChunkSse, acompanharDashboard, criarUrlDashboardSse } from '../src/services/dashboardSse'
import { dashboardSnapshotMock, respostaSse } from '../src/mocks/dashboardSseFixture'
import { formatarNumero, formatarPontosPercentuais, formatarVariacao } from '../src/utils/formatarDashboard'
import type { FiltrosDashboard } from '../src/types/dashboardAnalytics'
import { VisaoGeralTab } from '../src/components/DashboardTabs/VisaoGeralTab'
import { ItensVidaUtilTab } from '../src/components/DashboardTabs/ItensVidaUtilTab'
import { EvolucaoMovimentacoesTab } from '../src/components/DashboardTabs/EvolucaoMovimentacoesTab'
import { QualidadeDadosTab } from '../src/components/DashboardTabs/QualidadeDadosTab'
import { MateriaisSustentabilidadeTab } from '../src/components/DashboardTabs/MateriaisSustentabilidadeTab'
import { definirSessaoApi } from '../src/services/apiReal'

const endpoint = criarUrlDashboardSse({ period: '6m', view: 'todos' } as FiltrosDashboard).origin
  + '/api/v1/dashboard/overview'
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  definirSessaoApi(null, null)
})
afterAll(() => server.close())

describe('parser SSE do dashboard', () => {
  it('monta o endpoint a partir da base /api sem duplicar o prefixo', () => {
    const url = criarUrlDashboardSse(
      { period: '6m', view: 'todos' },
      'http://localhost:8000/api',
    )

    expect(url.toString()).toBe('http://localhost:8000/api/v1/dashboard/overview?period=6m&view=todos')
    expect(url.pathname.match(/\/api/g)).toHaveLength(1)
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
    expect(formatarVariacao(null)).toBe('Sem comparação disponível')
    expect(formatarPontosPercentuais(null)).toBe('variação indisponível')
  })
})

describe('origem dos cards e gráficos', () => {
  const filtros: FiltrosDashboard = { period: '6m', view: 'todos' }

  it('exibe o selo em cada card/gráfico abastecido por fixture no modo MSW', () => {
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
    expect(tela).toContain('Sem comparação disponível')
    expect(tela).toContain('variação indisponível')
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
    expect(visaoGeral).not.toContain('Lenovo')
    expect(visaoGeral).not.toContain('Fixture MSW')
    expect(telas.join('')).toContain('fonte confirmada')
    expect(vidaUtil).not.toContain('na seleção de demonstração')
    expect(evolucao).not.toContain('na seleção de demonstração')
  })
})

describe('integração MSW do stream', () => {
  const filtros: FiltrosDashboard = { period: '6m', view: 'todos' }

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
    definirSessaoApi(accessToken, null)
    server.use(http.get(endpoint, ({ request }) => {
      const url = new URL(request.url)
      expect(request.headers.get('Authorization')).toBe(`Bearer ${accessToken}`)
      expect(url.searchParams.has('access_token')).toBe(false)
      expect(url.toString()).not.toContain(accessToken)
      return respostaSse('unavailable', { detail: 'snapshot not ready' })
    }))
    const controlador = new AbortController()

    await acompanharDashboard(filtros, controlador.signal, {
      onSnapshot: () => undefined,
      onUnavailable: () => controlador.abort(),
      onError: () => undefined,
      onState: () => undefined,
    })
  })
})
