import { appendFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { test, expect, type Page, type Response } from '@playwright/test'
import { loadEnv } from 'vite'

const habilitado = process.env.ZERA_RUN_LIVE_QA === 'true' && process.env.ZERA_RUN_LIVE_QA_WRITE === 'true'
const env = habilitado ? loadEnv('development', process.cwd(), '') : {}
const email = env.ZERA_QA_GESTOR_EMAIL || env.QA_GESTOR_EMAIL || ''
const senha = env.ZERA_QA_GESTOR_PASSWORD || env.QA_GESTOR_PASSWORD || ''

async function registrar(resposta: Response, tipo: string): Promise<string> {
  expect(resposta.status()).toBe(201)
  const corpo = await resposta.json()
  expect(corpo.id).toMatch(/^[0-9a-f-]{36}$/i)
  const hora = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })
  appendFileSync(join(homedir(), 'zera-progresso.md'), `\n${hora} -03:00 QA interface ${tipo} HTTP 201 id ${corpo.id}\n`)
  return corpo.id
}

function aguardarCriacao(page: Page, recurso: string): Promise<Response> {
  return page.waitForResponse(resposta => resposta.request().method() === 'POST' && new URL(resposta.url()).pathname.endsWith(`/api/v1/${recurso}`))
}

test('QA real autorizado: categoria, modelo Outro e item criados na interface; cancelamento', async ({ page }) => {
  test.skip(!habilitado, 'Escritas reais exigem ZERA_RUN_LIVE_QA=true e ZERA_RUN_LIVE_QA_WRITE=true.')
  test.setTimeout(180_000)
  page.setDefaultTimeout(15_000)
  expect(Boolean(email && senha)).toBe(true)
  const data = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const prefixo = `TESTE-ZERA-${data}-interface`
  const categoria = `${prefixo}-categoria`
  const modelo = `${prefixo}-modelo`
  const item = `${prefixo}-item`
  let etapa = 'login'
  try {
    await page.goto('http://127.0.0.1:5184/login')
    await page.locator('#email').fill(email.trim())
    await page.locator('#senha').fill(senha)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Painel do Zera', exact: true })).toBeVisible({ timeout: 40_000 })
    await page.getByRole('link', { name: 'Itens', exact: true }).click()
    await page.getByRole('button', { name: 'Adicionar item', exact: true }).click()
    etapa = 'cadastro de categoria'
    await page.locator('#item-nome').fill(item)
    await page.locator('#item-material').selectOption('__nova__')
    await page.locator('#categoria-rapida-nome').fill(categoria)
    await page.locator('#categoria-rapida-descricao').fill(prefixo)
    const respostaCategoria = aguardarCriacao(page, 'categories')
    await page.getByRole('button', { name: 'Salvar categoria', exact: true }).click()
    const categoriaId = await registrar(await respostaCategoria, 'categoria')
    await expect(page.locator('#item-material option:checked')).toHaveText(categoria)
    etapa = 'cadastro de modelo'
    await page.locator('#item-modelo').selectOption('__novo__')
    await page.locator('#modelo-nome').fill(modelo)
    await page.locator('#modelo-fabricante').fill(prefixo)
    await page.getByRole('checkbox', { name: 'Outro', exact: true }).check()
    await page.locator('#modelo-outro-material').fill(prefixo)
    const respostaModelo = aguardarCriacao(page, 'models')
    await page.getByRole('button', { name: 'Concluir cadastro', exact: true }).last().click()
    const modeloId = await registrar(await respostaModelo, 'modelo')
    await expect(page.locator('#item-modelo option:checked')).toContainText(modelo)
    etapa = 'cadastro de item'
    await page.locator('#item-intensidade').selectOption('3')
    await page.locator('#item-tem-danos').selectOption('nao')
    await page.locator('#item-condicao').selectOption('usado')
    const respostaItem = aguardarCriacao(page, 'items')
    await page.getByRole('button', { name: 'Concluir cadastro', exact: true }).click()
    const itemId = await registrar(await respostaItem, 'item')
    await expect(page.getByRole('heading', { name: 'Item cadastrado', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Ver item', exact: true }).click()
    etapa = 'edição e cancelamento'
    await expect(page).toHaveURL(new RegExp(`/itens/${itemId}`))
    await page.getByRole('button', { name: 'Editar item', exact: true }).click()
    await page.locator('#api-item-nome').fill(`${prefixo}-alteracao-cancelada`)
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
    await page.getByRole('button', { name: 'Descartar alterações', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Editar item' })).toBeFocused()
    await expect(page.getByRole('heading', { name: item, exact: true })).toBeVisible()
    etapa = 'listagem da categoria'
    await page.getByRole('link', { name: 'Modelos', exact: true }).click()
    await page.locator('#busca-modelos').fill(categoria)
    await expect(page.getByRole('heading', { name: categoria, exact: true })).toBeVisible()
    const hora = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    appendFileSync(join(homedir(), 'zera-progresso.md'), `\n${hora} -03:00 QA interface confirmou detalhe do item ${itemId}, cancelamento e listagem da categoria ${categoriaId}; modelo ${modeloId}.\n`)
  } catch {
    await page.goto('about:blank').catch(() => undefined)
    throw new Error(`O percurso de escrita QA foi interrompido em ${etapa}; registros já criados estão no arquivo de progresso. Detalhes privados omitidos.`)
  }
})
