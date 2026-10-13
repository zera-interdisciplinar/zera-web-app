import { test, expect } from '@playwright/test'
import { loadEnv } from 'vite'
import { ehLocalApi } from '../src/utils/guardaDescarteApi'

const ativo = process.env.ZERA_RUN_LIVE_QA === 'true'
const env = ativo ? loadEnv('development', process.cwd(), '') : {}
const email = env.ZERA_QA_GESTOR_EMAIL || env.QA_GESTOR_EMAIL || ''
const senha = env.ZERA_QA_GESTOR_PASSWORD || env.QA_GESTOR_PASSWORD || ''

test('QA real: interface reproduz nomes e endereços retornados para São Paulo', async ({ page }) => {
  test.skip(!ativo, 'Leitura real exige ZERA_RUN_LIVE_QA=true.')
  test.setTimeout(120_000)
  expect(Boolean(email && senha)).toBe(true)
  try {
    await page.goto('http://127.0.0.1:5184/login')
    await page.locator('#email').fill(email.trim())
    await page.locator('#senha').fill(senha)
    await page.getByRole('button', { name: 'Entrar', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Painel do Zera' })).toBeVisible({ timeout: 40_000 })
    await page.getByRole('link', { name: 'Locais de reciclagem', exact: true }).click()
    await page.locator('#locais-lat').fill('-23.5505')
    await page.locator('#locais-lng').fill('-46.6333')
    await page.locator('#locais-radiusMeters').fill('5000')
    const requisicao = page.waitForResponse(resposta => new URL(resposta.url()).pathname.endsWith('/api/v1/recycling-places'))
    await page.getByRole('button', { name: 'Buscar locais', exact: true }).click()
    const resposta = await requisicao
    expect(resposta.status()).toBe(200)
    const dados: unknown = await resposta.json()
    if (!Array.isArray(dados) || !dados.every(ehLocalApi)) throw new Error('Formato de locais inesperado')
    const lista = page.getByRole('region', { name: 'Buscar locais de reciclagem' }).locator('ul > li')
    await expect(lista).toHaveCount(dados.length, { timeout: 30_000 })
    for (let indice = 0; indice < dados.length; indice += 1) {
      await expect(lista.nth(indice).locator('h3')).toHaveText(dados[indice].name)
      await expect(lista.nth(indice).locator('p').first()).toHaveText(dados[indice].address || 'Endereço não informado.')
    }
    console.log(`QA locais: HTTP 200, ${dados.length} resultados comparados; ${new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' })} -03:00`)
  } catch {
    await page.goto('about:blank').catch(() => undefined)
    throw new Error('Comparação de locais interrompida; detalhes privados omitidos.')
  }
})
