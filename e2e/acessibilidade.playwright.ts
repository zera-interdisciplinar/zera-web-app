import { test, expect, type Page } from '@playwright/test'
import { AxeBuilder } from '@axe-core/playwright'
import { base, preparar } from './api-controlada'

const abrir = async (page: Page) => {
  await page.getByRole('button', { name: 'Abrir opções de acessibilidade' }).click()
  await expect(page.getByRole('dialog', { name: 'Acessibilidade' })).toBeVisible()
}
const semRolagemHorizontal = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)

test('T-25: o painel não fecha ao navegar com Tab e fecha só por Fechar ou Esc (A-1)', async ({ page }) => {
  await preparar(page)
  await abrir(page)
  await expect(page.getByRole('heading', { name: 'Acessibilidade' })).toBeFocused()
  for (let passo = 0; passo < 40; passo += 1) await page.keyboard.press('Tab')
  await expect(page.getByRole('dialog', { name: 'Acessibilidade' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Acessibilidade' })).toBeHidden()
  await expect(page.getByRole('button', { name: 'Abrir opções de acessibilidade' })).toBeFocused()
  await abrir(page)
  await page.getByRole('button', { name: 'Fechar', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Acessibilidade' })).toBeHidden()
})

test('T-25: a 200% do tamanho do texto não há rolagem horizontal em 1280 px (A-4)', async ({ page }) => {
  await preparar(page)
  await page.setViewportSize({ width: 1280, height: 900 })
  await abrir(page)
  await page.getByLabel('Tamanho do texto').selectOption('200')
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).fontSize)).toBe('32px')
  for (const rota of ['/', '/itens', '/modelos']) {
    await page.evaluate((url) => { history.pushState(null, '', url); dispatchEvent(new PopStateEvent('popstate')) }, rota)
    await expect(page.getByRole('main')).toBeVisible()
    expect(await semRolagemHorizontal(page), rota).toBe(true)
  }
})

test('T-25: espaçamento de texto aplica os valores da WCAG 1.4.12 sem estourar o layout (A-3)', async ({ page }) => {
  await preparar(page)
  await abrir(page)
  await page.getByLabel('Espaçar letras, palavras, linhas e parágrafos').check()
  const estilo = await page.locator('main p').first().evaluate((el) => { const c = getComputedStyle(el); return { letra: c.letterSpacing, palavra: c.wordSpacing, fonte: Number.parseFloat(c.fontSize), linha: Number.parseFloat(c.lineHeight) } })
  expect(Number.parseFloat(estilo.letra)).toBeCloseTo(estilo.fonte * 0.12, 1)
  expect(Number.parseFloat(estilo.palavra)).toBeCloseTo(estilo.fonte * 0.16, 1)
  expect(estilo.linha).toBeGreaterThanOrEqual(estilo.fonte * 1.5 - 0.5)
  expect(await semRolagemHorizontal(page)).toBe(true)
})

test('T-25: reduzir movimento desliga transições e a preferência do sistema é o ponto de partida (A-6)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await preparar(page)
  await abrir(page)
  await expect(page.getByLabel('Reduzir movimento')).toBeChecked()
  expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe('reduced')
  const duracao = await page.getByRole('link', { name: 'Itens', exact: true }).evaluate((el) => getComputedStyle(el).transitionDuration)
  expect(duracao.split(',').every((valor) => Number.parseFloat(valor) === 0)).toBe(true)
})

test('T-25: fonte de leitura facilitada usa Atkinson e as fontes do Figma estão em uso (A-2)', async ({ page }) => {
  await preparar(page)
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/^Inter/)
  await abrir(page)
  await page.getByLabel('Fonte de leitura facilitada').check()
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/Atkinson/)
  expect(await page.evaluate(() => /Comic/i.test(getComputedStyle(document.body).fontFamily))).toBe(false)
  await expect.poll(() => page.evaluate(() => document.fonts.check('16px "Atkinson Hyperlegible"'))).toBe(true)
})

test('T-25: a ajuda de voz só lista rotas que existem e não há simulação de daltonismo (A-7, A-8)', async ({ page }) => {
  await preparar(page)
  await abrir(page)
  await page.getByRole('button', { name: 'Ajuda de teclado' }).click()
  const ajuda = await page.locator('[id$="-help"]').innerText()
  for (const rota of ['dashboard', 'itens', 'modelos', 'configurações']) expect(ajuda).toContain(`ir para ${rota}`)
  for (const obsoleta of ['recicladoras', 'funcionários', 'relatórios', 'login']) expect(ajuda).not.toContain(obsoleta)
  await expect(page.getByText(/daltonismo|protanopia|deuteranopia|tritanopia/i)).toHaveCount(0)
})

test('T-25: alto contraste mantém o painel sem violações do axe', async ({ page }) => {
  await preparar(page)
  await abrir(page)
  await page.getByLabel('Alto contraste').check()
  expect(await page.evaluate(() => document.documentElement.dataset.contrast)).toBe('high')
  const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
  expect(resultado.violations.map((violacao) => violacao.id)).toEqual([])
})

test('T-26: o login usa Instrument Sans e as medidas do Figma', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`${base}/login`)
  const titulo = page.getByRole('heading', { name: 'Entrar', exact: true })
  const estilo = await titulo.evaluate((el) => { const c = getComputedStyle(el); return { familia: c.fontFamily, tamanho: c.fontSize, peso: c.fontWeight, linha: c.lineHeight, cor: c.color } })
  expect(estilo).toMatchObject({ tamanho: '36px', peso: '700', linha: '42px', cor: 'rgb(32, 59, 126)' })
  expect(estilo.familia).toMatch(/^"?Instrument Sans/)
  const cartao = await titulo.locator('..').boundingBox()
  expect(Math.round(cartao!.width)).toBe(480)
  const campo = await page.locator('#email').evaluate((el) => (el.closest('div[class*="controleComIcones"]') as HTMLElement).getBoundingClientRect().height)
  expect(Math.round(campo)).toBe(52)
  const botao = await page.getByRole('button', { name: 'Entrar', exact: true }).boundingBox()
  expect(Math.round(botao!.height)).toBe(56)
  await page.screenshot({ path: 'test-results/login-figma-1440.png' })
})
