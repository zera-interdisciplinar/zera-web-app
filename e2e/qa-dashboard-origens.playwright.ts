import { expect, test } from '@playwright/test'
import { loadEnv } from 'vite'
import { mapearItem } from '../src/services/mapeadoresApi'
import { lerItemApi } from '../src/utils/guardaItemApi'
import { ROTULO_CONDICAO, ROTULO_STATUS, type ProdutoDetalhado } from '../src/types/produto'

const habilitado = process.env.ZERA_RUN_LIVE_QA === 'true'
const env = habilitado ? loadEnv('development', process.cwd(), '') : {}
const contas = [
  { perfil: 'gestor', email: env.ZERA_QA_GESTOR_EMAIL || env.QA_GESTOR_EMAIL, senha: env.ZERA_QA_GESTOR_PASSWORD || env.QA_GESTOR_PASSWORD },
  { perfil: 'funcionario', email: env.ZERA_QA_FUNCIONARIO_EMAIL || env.QA_OPERADOR_EMAIL || env.QA_OPERARIO_EMAIL, senha: env.ZERA_QA_FUNCIONARIO_PASSWORD || env.QA_OPERADOR_PASSWORD || env.QA_OPERARIO_PASSWORD },
] as const
const sites = [
  { nome: 'vercel', url: 'https://zera-web-app-kappa.vercel.app', hash: false },
  { nome: 'pages', url: 'https://zera-interdisciplinar.github.io/zera-web-app/', hash: true },
] as const

type RegistroItem = Pick<ProdutoDetalhado, 'status' | 'condicao' | 'categoriaNome' | 'dataEntrada' | 'criadoPorId'>
type Home = { activeItems: number; pendingApproval: number; inMaintenance: number; awaitingEvaluation: number; disposalsInWindow: number }
type PesoMes = { month: string; weightKg: number }
type Material = { material: string; weightKg: number; percent: number }
type Indicadores = { totalWeightKg: number; recyclingRatePercent: number | null; monthlyWeightKg: PesoMes[]; weightByMaterial: Material[] }

function registro(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor)
}
function numero(valor: unknown): valor is number {
  return typeof valor === 'number' && Number.isFinite(valor)
}
function lerHome(valor: unknown): Home | null {
  if (!registro(valor)) return null
  if (!numero(valor.activeItems) || !numero(valor.pendingApproval) || !numero(valor.inMaintenance)
    || !numero(valor.awaitingEvaluation) || !numero(valor.disposalsInWindow)) return null
  return { activeItems: valor.activeItems, pendingApproval: valor.pendingApproval, inMaintenance: valor.inMaintenance,
    awaitingEvaluation: valor.awaitingEvaluation, disposalsInWindow: valor.disposalsInWindow }
}
function lerIndicadores(valor: unknown): Indicadores | null {
  if (!registro(valor) || !numero(valor.totalWeightKg)
    || !(valor.recyclingRatePercent === null || numero(valor.recyclingRatePercent))
    || !Array.isArray(valor.monthlyWeightKg) || !Array.isArray(valor.weightByMaterial)) return null
  const monthlyWeightKg: PesoMes[] = []
  for (const linha of valor.monthlyWeightKg) {
    if (!registro(linha) || typeof linha.month !== 'string' || !numero(linha.weightKg)) return null
    monthlyWeightKg.push({ month: linha.month, weightKg: linha.weightKg })
  }
  const weightByMaterial: Material[] = []
  for (const linha of valor.weightByMaterial) {
    if (!registro(linha) || typeof linha.material !== 'string' || !numero(linha.weightKg) || !numero(linha.percent)) return null
    weightByMaterial.push({ material: linha.material, weightKg: linha.weightKg, percent: linha.percent })
  }
  return { totalWeightKg: valor.totalWeightKg, recyclingRatePercent: valor.recyclingRatePercent, monthlyWeightKg, weightByMaterial }
}
function agrupar(rotulos: string[]): Map<string, number> {
  const resultado = new Map<string, number>()
  for (const rotulo of rotulos) resultado.set(rotulo, (resultado.get(rotulo) ?? 0) + 1)
  return resultado
}
function formatar(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(valor)
}
function lerNumeroPtBr(valor: string): number {
  return Number(valor.replace(/\./g, '').replace(',', '.'))
}
function iguais<T>(atual: T[], esperado: T[]): boolean {
  return atual.length === esperado.length && atual.every((valor, indice) => JSON.stringify(valor) === JSON.stringify(esperado[indice]))
}

for (const site of sites) for (const conta of contas) {
  test(`gráficos publicados refletem as respostas da API: ${site.nome}, ${conta.perfil}`, async ({ page }) => {
    test.skip(!habilitado, 'Ative explicitamente ZERA_RUN_LIVE_QA=true para consultar o QA.')
    test.skip(!conta.email || !conta.senha, 'Conta QA local ausente; nenhuma credencial está no teste.')
    if (!conta.email || !conta.senha) return
    test.setTimeout(240_000)
    let identidade = ''
    let resumo: Home | null = null
    let indicadores: Indicadores | null = null
    let totalPaginasItens: number | null = null
    const itensPorPagina = new Map<number, RegistroItem[]>()
    const paginasModelos = new Map<number, number>()
    let totalPaginasModelos: number | null = null
    let totalModelos: number | null = null
    let respostaInvalida: string | null = null

    await page.route('**/*', route => {
      const req = route.request()
      const login = req.method() === 'POST' && new URL(req.url()).pathname.endsWith('/api/v1/auth/login')
      if (!['GET', 'OPTIONS'].includes(req.method()) && !login) return route.abort()
      return route.continue()
    })
    page.on('response', async response => {
      if (response.request().method() !== 'GET' || !response.ok()) return
      const url = new URL(response.url())
      const pathname = url.pathname
      try {
        if (pathname.includes('/users/')) {
          const body: unknown = await response.json()
          if (registro(body) && typeof body.userId === 'string') identidade = body.userId
        } else if (pathname.endsWith('/dashboard/home')) {
          resumo = lerHome(await response.json())
          if (!resumo) respostaInvalida = 'home-format'
        } else if (pathname.endsWith('/dashboard/indicators')) {
          indicadores = lerIndicadores(await response.json())
          if (!indicadores) respostaInvalida = 'indicators-format'
        } else if (pathname.endsWith('/items')) {
          const body: unknown = await response.json()
          if (!registro(body) || !Array.isArray(body.content) || !numero(body.totalElements) || !numero(body.totalPages)) {
            respostaInvalida = 'items-envelope'
            return
          }
          const pagina = Number(url.searchParams.get('page') ?? '0')
          const itens = body.content.map(valor => {
            const produto = mapearItem(lerItemApi(valor))
            return { status: produto.status, condicao: produto.condicao, categoriaNome: produto.categoriaNome,
              dataEntrada: produto.dataEntrada, criadoPorId: produto.criadoPorId }
          })
          itensPorPagina.set(pagina, itens)
          totalPaginasItens = body.totalPages
        } else if (pathname.endsWith('/models')) {
          const body: unknown = await response.json()
          if (!registro(body) || !Array.isArray(body.content) || !numero(body.totalElements) || !numero(body.totalPages)) return
          const pagina = Number(url.searchParams.get('page') ?? '0')
          paginasModelos.set(pagina, body.content.length)
          totalModelos = body.totalElements
          totalPaginasModelos = body.totalPages
        }
      } catch {
        if (pathname.endsWith('/items')) respostaInvalida = 'items-contract'
        else if (pathname.endsWith('/dashboard/home')) respostaInvalida = 'home-contract'
        else if (pathname.endsWith('/dashboard/indicators')) respostaInvalida = 'indicators-contract'
        else if (pathname.endsWith('/models')) respostaInvalida = 'models-contract'
      }
    })

    await page.goto(site.hash ? `${site.url}#/login` : `${site.url}/login`)
    await page.locator('#email').fill(conta.email!)
    await page.locator('#senha').fill(conta.senha!)
    await page.getByRole('button', { name: 'Entrar', exact: true }).press('Enter')
    await expect(page.getByRole('heading', { level: 1,
      name: conta.perfil === 'gestor' ? 'Painel do Zera' : 'Meus itens', exact: true })).toBeVisible({ timeout: 35_000 })
    if (conta.perfil === 'funcionario') await page.getByRole('button', { name: 'Ver indicadores da unidade' }).press('Enter')
    await page.getByRole('tab', { name: 'Visão geral', exact: true }).press('Enter')
    await expect(page.getByRole('tabpanel').locator('[data-estado="carregando"]')).toHaveCount(0, { timeout: 180_000 })
    await expect.poll(() => resumo !== null && indicadores !== null && totalPaginasItens !== null && identidade.length > 0).toBe(true)
    await expect.poll(() => itensPorPagina.size).toBe(Math.max(1, totalPaginasItens ?? 0))
    expect(respostaInvalida, 'A resposta real precisa corresponder ao contrato antes de comparar o gráfico.').toBeNull()

    const dadosApi = [...itensPorPagina.values()].flat()
      .filter(item => conta.perfil === 'gestor' || item.criadoPorId != null && String(item.criadoPorId) === String(identidade))
    const apiHome = resumo!
    const apiIndicadores = indicadores!
    const artigos = page.getByRole('article')
    for (const [titulo, valor] of [
      ['Itens ativos', apiHome.activeItems], ['Aguardando aprovação', apiHome.pendingApproval],
      ['Em manutenção', apiHome.inMaintenance], ['Aguardando avaliação', apiHome.awaitingEvaluation],
      ['Descartes no período', apiHome.disposalsInWindow], ['Peso total descartado (kg)', apiIndicadores.totalWeightKg],
    ] as const) {
      const artigo = artigos.filter({ has: page.getByRole('heading', { name: titulo, exact: true }) })
      await expect(artigo.locator('p').first()).toHaveText(formatar(valor))
    }
    const distribuicoes = [
      ['Itens por situação', agrupar(dadosApi.map(item => ROTULO_STATUS[item.status]))],
      ['Itens por categoria', agrupar(dadosApi.map(item => item.categoriaNome))],
      ['Itens por condição', agrupar(dadosApi.map(item => ROTULO_CONDICAO[item.condicao]))],
    ] as const
    for (const [titulo, esperado] of distribuicoes) {
      const regiao = page.getByRole('region', { name: `${titulo} · gráfico` })
      if (esperado.size === 0) {
        await expect(regiao.getByRole('status')).toBeVisible()
        continue
      }
      await regiao.getByText('Consultar os dados do gráfico').click()
      const linhas = await regiao.getByRole('table').locator('tbody tr').all()
      const atual: Array<[string, number]> = []
      for (const linha of linhas) atual.push([(await linha.locator('th').innerText()).trim(), lerNumeroPtBr((await linha.locator('td').innerText()).trim())])
      const pares = (mapa: Map<string, number>) => [...mapa.entries()].sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
      expect(iguais(pares(new Map(atual)), pares(esperado))).toBe(true)
    }

    const peso = page.getByRole('region', { name: 'Peso descartado por mês' })
    await peso.getByText('Ver em tabela').click()
    const linhasPeso = await peso.getByRole('table').locator('tbody tr').all()
    const pesosTela: number[] = []
    for (const linha of linhasPeso) pesosTela.push(lerNumeroPtBr((await linha.locator('td').innerText()).trim()))
    expect(iguais(pesosTela, apiIndicadores.monthlyWeightKg.map(ponto => ponto.weightKg))).toBe(true)
    const reciclagem = page.getByRole('region', { name: 'Taxa de reciclagem do inventário' })
    if (apiIndicadores.recyclingRatePercent === null) await expect(reciclagem).toContainText('ainda não foi calculada')
    else await expect(reciclagem.getByRole('img', { name: `Taxa de reciclagem: ${apiIndicadores.recyclingRatePercent}%` })).toBeVisible()

    await page.getByRole('tab', { name: 'Itens e vida útil', exact: true }).press('Enter')
    await expect.poll(() => paginasModelos.size).toBe(Math.max(1, totalPaginasModelos ?? 0))
    expect([...paginasModelos.values()].reduce((soma, valor) => soma + valor, 0)).toBe(totalModelos)
    const tabelaModelos = page.getByRole('table', { name: 'Características estimadas por modelo' })
    await expect(tabelaModelos.getByRole('row')).toHaveCount((totalModelos ?? 0) + 1)

    await page.getByRole('tab', { name: 'Evolução e movimentações', exact: true }).press('Enter')
    const porMes = await page.evaluate((datas) => {
      const totais = new Map<string, number>()
      for (const iso of datas) {
        const data = new Date(iso)
        const mes = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
        totais.set(mes, (totais.get(mes) ?? 0) + 1)
      }
      return [...totais.entries()].sort(([a], [b]) => a.localeCompare(b))
    }, dadosApi.map(item => item.dataEntrada))
    const evolucao = page.getByRole('region', { name: 'Evolução mensal dos cadastros · gráfico' })
    if (porMes.length > 0) {
      await evolucao.getByText('Consultar os dados do gráfico').click()
      const linhas = await evolucao.getByRole('table').locator('tbody tr').all()
      const atual: Array<[string, number]> = []
      for (const linha of linhas) atual.push([(await linha.locator('th').innerText()).trim(), lerNumeroPtBr((await linha.locator('td').innerText()).trim())])
      expect(iguais(atual, porMes)).toBe(true)
    } else await expect(evolucao.getByRole('status')).toBeVisible()

    await page.getByRole('tab', { name: 'Materiais e sustentabilidade', exact: true }).press('Enter')
    const graficoMateriais = page.getByRole('region', { name: 'Peso descartado por material · gráfico' })
    if (apiIndicadores.weightByMaterial.length > 0) {
      await graficoMateriais.getByText('Consultar os dados do gráfico').click()
      const linhas = await graficoMateriais.getByRole('table').locator('tbody tr').all()
      const somaTela = (await Promise.all(linhas.map(async linha => lerNumeroPtBr((await linha.locator('td').innerText()).trim())))).reduce((soma, valor) => soma + valor, 0)
      const somaApi = apiIndicadores.weightByMaterial.reduce((soma, ponto) => soma + ponto.weightKg, 0)
      expect(Math.abs(somaTela - somaApi) < 0.011 && linhas.length === apiIndicadores.weightByMaterial.length).toBe(true)
    } else await expect(graficoMateriais.getByRole('status')).toBeVisible()
  })
}
