import { test, expect } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { loadEnv } from 'vite'
import path from 'node:path'
import { mkdirSync } from 'node:fs'

const habilitado = process.env.ZERA_RUN_LIVE_QA === 'true'
const env = habilitado ? loadEnv('development', process.cwd(), '') : {}
const contas = [
  { perfil: 'gestor', email: env.ZERA_QA_GESTOR_EMAIL || env.QA_GESTOR_EMAIL, senha: env.ZERA_QA_GESTOR_PASSWORD || env.QA_GESTOR_PASSWORD },
  { perfil: 'funcionario', email: env.ZERA_QA_FUNCIONARIO_EMAIL || env.QA_OPERADOR_EMAIL || env.QA_OPERARIO_EMAIL, senha: env.ZERA_QA_FUNCIONARIO_PASSWORD || env.QA_OPERADOR_PASSWORD || env.QA_OPERARIO_PASSWORD },
]
const sites = [
  { nome: 'vercel', url: 'https://zera-web-app-kappa.vercel.app', hash: false },
  { nome: 'pages', url: 'https://zera-interdisciplinar.github.io/zera-web-app/', hash: true },
  ...(process.env.ZERA_QA_LOCAL_URL ? [{ nome: 'clone-limpo', url: process.env.ZERA_QA_LOCAL_URL, hash: false }] : []),
]
for (const site of sites) for (const conta of contas) {
  test(`publicação em leitura: ${site.nome}, ${conta.perfil}`, async ({ page }) => {
    test.skip(!habilitado, 'Ative explicitamente ZERA_RUN_LIVE_QA=true para consultar o QA.')
    test.skip(!conta.email || !conta.senha, 'Conta local ausente; não há credencial embutida no teste.')
    test.setTimeout(300_000)
    const nomes = new Set<string>()
    const modelosPorPagina = new Map<number, number>()
    let totalModelos: number | null = null
    let totalPaginasModelos: number | null = null
    let totalCategorias: number | null = null
    let identidade = ''
    let item: string | undefined
    let bloqueadas = 0
    await page.route('**/*', route => {
      const req = route.request()
      if (!['GET', 'OPTIONS'].includes(req.method()) && !(req.method() === 'POST' && new URL(req.url()).pathname.endsWith('/api/v1/auth/login'))) {
        bloqueadas += 1
        return route.abort()
      }
      return route.continue()
    })
    page.on('response', async response => {
      try {
        const pathname = new URL(response.url()).pathname
        if (pathname.includes('/users/')) {
          const pessoa = await response.json()
          identidade = pessoa.userId
          if (typeof pessoa.name === 'string') nomes.add(pessoa.name)
        }
        if (pathname.endsWith('/items')) {
          const dados = await response.json()
          const itens = Array.isArray(dados.content) ? dados.content : []
          item = itens.find((registro: { createdBy?: string }) => conta.perfil === 'gestor' || registro.createdBy === identidade)?.id
          for (const registro of itens) if (typeof registro.createdByName === 'string') nomes.add(registro.createdByName)
        }
        if (response.request().method() === 'GET' && pathname.endsWith('/models')) {
          const dados: unknown = await response.json()
          if (typeof dados === 'object' && dados !== null && 'content' in dados && Array.isArray(dados.content)
            && 'totalElements' in dados && typeof dados.totalElements === 'number'
            && 'totalPages' in dados && typeof dados.totalPages === 'number') {
            const pagina = Number(new URL(response.url()).searchParams.get('page') ?? '0')
            modelosPorPagina.set(pagina, dados.content.length)
            totalModelos = dados.totalElements
            totalPaginasModelos = dados.totalPages
          }
        }
        if (response.request().method() === 'GET' && pathname.endsWith('/categories')) {
          const dados: unknown = await response.json()
          if (Array.isArray(dados)) totalCategorias = dados.length
        }
      } catch { /* Só metadados em memória; nunca gravar respostas privadas. */ }
    })
    async function entrar() {
      try {
        await page.locator('#email').fill(conta.email)
        await page.locator('#senha').fill(conta.senha)
        await page.getByRole('button', { name: 'Entrar', exact: true }).press('Enter')
      } catch { throw new Error('Não foi possível concluir o preenchimento do login; detalhes privados omitidos.') }
    }
    async function navegar(rota: string) {
      await page.evaluate(({ rota, hash }) => {
        if (hash) location.hash = rota
        else { history.pushState(null, '', rota); dispatchEvent(new PopStateEvent('popstate')) }
      }, { rota, hash: site.hash })
    }
    async function conferir(nome: string, largura: number) {
      await expect(page.locator('main')).toBeVisible()
      const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
      expect(resultado.violations.map(v => v.id)).toEqual([])
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      const pasta = process.env.ZERA_QA_ARTIFACT_DIR
      if (pasta) {
        mkdirSync(pasta, { recursive: true })
        const textoDaTabela = nome === 'itens' ? [page.locator('table tbody td:first-child')] : []
        await page.screenshot({ path: path.join(pasta, `${site.nome}-${conta.perfil}-${nome}-${largura}.png`), fullPage: true,
          mask: [page.locator('header'), page.locator('aside'), page.getByText(/[^\s]+@[^\s]+\.[^\s]+/), ...textoDaTabela, ...[...nomes].map(valor => page.getByText(valor, { exact: true }))] })
      }
    }
    try {
      await page.goto(site.hash ? site.url + '#/login' : site.url + '/login')
      await entrar()
      await expect(page.getByRole('heading', { level: 1, name: conta.perfil === 'gestor' ? 'Painel do Zera' : 'Meus itens', exact: true })).toBeVisible({ timeout: 35_000 })
      for (const largura of [1280, 768, 320]) {
        await page.setViewportSize({ width: largura, height: 900 })
        for (const [rota, titulo] of [['/modelos', 'Modelos'], ['/itens', 'Gestão de itens'], ['/descartes', 'Registros de descarte'], ['/recicladoras', 'Locais de reciclagem']]) {
          await navegar(rota)
          await expect(page.getByRole('heading', { level: 1, name: titulo, exact: true })).toBeVisible()
          await expect(page.getByText(/^(Carregando os modelos\.|Carregando os itens do inventário\.)$/)).toHaveCount(0, { timeout: 30_000 })
          if (rota === '/modelos') {
            const categorias = page.locator('section[aria-labelledby="titulo-categorias"]')
            await expect(categorias.getByRole('heading', { name: 'Categorias', exact: true })).toBeVisible()
            await expect.poll(() => totalCategorias, { timeout: 30_000 }).not.toBeNull()
            await expect(categorias.locator('article')).toHaveCount(totalCategorias ?? 0)
            await expect.poll(() => totalModelos, { timeout: 30_000 }).not.toBeNull()
            await expect.poll(() => modelosPorPagina.size, { timeout: 30_000 }).toBe(totalPaginasModelos)
            const total = totalModelos ?? 0
            const exibidosPelaApi = [...modelosPorPagina.values()].reduce((soma, quantidade) => soma + quantidade, 0)
            expect(exibidosPelaApi).toBe(total)
            if (total > 0) {
              await expect(page.getByRole('heading', { name: `Todos os modelos (${total} modelos)`, exact: true })).toBeVisible()
              await expect(page.getByRole('region', { name: 'Modelos cadastrados com fabricante, categoria e vida útil' }).getByRole('table').getByRole('row')).toHaveCount(total + 1)
            }
          }
          if (rota === '/itens' && conta.perfil === 'gestor') {
            const adicionar = page.locator('#adicionar-item')
            await adicionar.click()
            const formulario = page.getByRole('dialog', { name: 'Cadastrar item' })
            await expect(formulario).toBeVisible()
            const categoriasDoFormulario = page.locator('#item-material option')
            await expect(categoriasDoFormulario).toHaveCount((totalCategorias ?? 0) + 2)
            await page.keyboard.press('Escape')
            await expect(formulario).toBeHidden()
            await expect(adicionar).toBeFocused()
          }
          await conferir(rota.slice(1), largura)
        }
        await navegar('/')
        if (conta.perfil === 'funcionario') await page.getByRole('button', { name: 'Ver indicadores da unidade' }).press('Enter')
        for (const aba of ['Visão geral', 'Itens e vida útil', 'Evolução e movimentações', 'Qualidade dos dados e alertas', 'Materiais e sustentabilidade']) {
          await page.getByRole('tab', { name: aba, exact: true }).press('Enter')
          await expect(page.getByRole('tabpanel')).toBeVisible()
          await expect(page.getByRole('tabpanel').locator('[data-estado="carregando"]')).toHaveCount(0, { timeout: 200_000 })
          if (['Visão geral', 'Evolução e movimentações', 'Qualidade dos dados e alertas'].includes(aba)) await expect(page.locator('div[data-estado="sucesso"], div[data-estado="erro"], div[data-estado="indisponivel"]')).toBeVisible({ timeout: 200_000 })
          await conferir('painel-' + aba.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\W+/g, '-'), largura)
        }
      }
      if (item) {
        await navegar('/itens/' + encodeURIComponent(item))
        await expect(page.getByRole('tab', { name: 'Dados', exact: true })).toBeVisible({ timeout: 30_000 })
        await page.reload()
        await expect(page.locator('#email')).toBeVisible()
        await entrar()
        await expect(page.getByRole('tab', { name: 'Dados', exact: true })).toBeVisible({ timeout: 30_000 })
      }
      expect(bloqueadas).toBe(0)
    } catch {
      await page.goto('about:blank').catch(() => undefined)
      throw new Error('Fluxo publicado não terminou. Dados privados foram omitidos; consulte a matriz de saúde para status e tempos.')
    }
  })
}
