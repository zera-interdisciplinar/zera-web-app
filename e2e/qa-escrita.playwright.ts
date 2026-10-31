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
    await expect(page.getByRole('heading', { name: 'Visão geral', exact: true })).toBeVisible({ timeout: 40_000 })
    const dialog = page.getByRole('dialog')
    await page.getByRole('link', { name: 'Modelos', exact: true }).click()
    etapa = 'cadastro de categoria'
    await page.getByRole('tab', { name: 'Categorias' }).click()
    await page.getByRole('button', { name: 'Nova categoria' }).click()
    await dialog.getByLabel('Nome').fill(categoria)
    await dialog.getByLabel('Descrição').fill(prefixo)
    const respostaCategoria = aguardarCriacao(page, 'categories')
    await dialog.getByRole('button', { name: 'Criar categoria' }).click()
    const categoriaId = await registrar(await respostaCategoria, 'categoria')
    await expect(page.getByRole('cell', { name: categoria, exact: true })).toBeVisible()
    etapa = 'cadastro de modelo'
    await page.getByRole('tab', { name: 'Modelos' }).click()
    await page.getByRole('button', { name: 'Novo modelo' }).click()
    await dialog.getByLabel('Nome do modelo').fill(modelo)
    await dialog.getByLabel('Fabricante').fill(prefixo)
    await dialog.getByLabel(/^Categoria/).selectOption(categoriaId)
    await dialog.getByLabel('Outro', { exact: true }).check()
    const respostaModelo = aguardarCriacao(page, 'models')
    await dialog.getByRole('button', { name: 'Cadastrar modelo' }).click()
    const modeloId = await registrar(await respostaModelo, 'modelo')
    etapa = 'cadastro de item'
    await page.getByRole('link', { name: 'Itens', exact: true }).click()
    await page.getByRole('button', { name: 'Adicionar item' }).click()
    await dialog.getByLabel('Código de barras').fill(`${prefixo}-${Date.now()}`)
    await dialog.getByLabel('Selecione o modelo').selectOption(modeloId)
    await dialog.getByLabel('Nome do item').fill(item)
    await dialog.getByLabel('Condição').selectOption('USED')
    await dialog.getByLabel('Não', { exact: true }).check()
    await dialog.getByLabel('Intensidade de uso (0 a 10)').fill('3')
    const respostaItem = aguardarCriacao(page, 'items')
    await dialog.getByRole('button', { name: 'Concluir cadastro' }).click()
    const itemId = await registrar(await respostaItem, 'item')
    await expect(dialog).toBeHidden()
    etapa = 'detalhe, edição e cancelamento'
    await page.getByRole('searchbox').fill(item)
    await page.getByRole('link', { name: item, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/itens/${itemId}`))
    await page.getByRole('button', { name: `Editar ${item}` }).click()
    await dialog.getByLabel('Nome do item').fill(`${prefixo}-alteracao-cancelada`)
    await dialog.getByRole('button', { name: 'Cancelar' }).click()
    await page.getByRole('dialog', { name: 'Descartar alterações?' }).getByRole('button', { name: 'Descartar', exact: true }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByRole('heading', { name: item, exact: true, level: 1 })).toBeVisible()
    etapa = 'listagem da categoria'
    await page.getByRole('link', { name: 'Modelos', exact: true }).click()
    await page.getByRole('tab', { name: 'Categorias' }).click()
    await expect(page.getByRole('cell', { name: categoria, exact: true })).toBeVisible()
    const hora = new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })
    appendFileSync(join(homedir(), 'zera-progresso.md'), `\n${hora} -03:00 QA interface confirmou detalhe do item ${itemId}, cancelamento e listagem da categoria ${categoriaId}; modelo ${modeloId}.\n`)
  } catch {
    await page.goto('about:blank').catch(() => undefined)
    throw new Error(`O percurso de escrita QA foi interrompido em ${etapa}; registros já criados estão no arquivo de progresso. Detalhes privados omitidos.`)
  }
})
