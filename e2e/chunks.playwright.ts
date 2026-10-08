import { expect, test } from '@playwright/test'
import { existsSync, statSync } from 'node:fs'
import { extname, resolve, sep } from 'node:path'
import { preparar } from './api-controlada'

test('cada rota permitida carrega seu chunk de produção no primeiro acesso', async ({ page }, info) => {
  test.skip(process.env.ZERA_RUN_PRODUCTION_TESTS !== 'true', 'Exige build de produção.')
  // Origem HTTPS controlada: testa o dist sem desativar a proteção HTTPS do app.
  const origem = 'https://producao.example.invalid'
  const dist = resolve('dist')
  const mime: Record<string, string> = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.woff': 'font/woff', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' }
  await page.route(`${origem}/**`, route => {
    const caminho = new URL(route.request().url()).pathname
    const arquivo = resolve(dist, `.${caminho}`)
    const existe = arquivo.startsWith(dist + sep) && existsSync(arquivo) && statSync(arquivo).isFile()
    if (caminho.startsWith('/assets/') && !existe) return route.fulfill({ status: 404 })
    const alvo = existe ? arquivo : resolve(dist, 'index.html')
    return route.fulfill({ path: alvo, contentType: mime[extname(alvo)] ?? 'application/octet-stream' })
  })
  const scripts = new Set<string>()
  page.on('response', resposta => {
    const caminho = new URL(resposta.url()).pathname
    if (resposta.ok() && caminho.endsWith('.js')) scripts.add(caminho)
  })
  await preparar(page, 'MANAGER', 0, origem)
  await expect(page.getByRole('heading', { level: 1, name: 'Painel do Zera', exact: true })).toBeVisible()
  const registro: Array<{ rota: string; chunks: string[] }> = []
  for (const [rota, titulo] of [
    ['/itens', 'Gestão de itens'], ['/itens/item-proprio', 'Notebook próprio'],
    ['/modelos', 'Modelos'], ['/recicladoras', 'Locais de reciclagem'],
    ['/descartes', 'Registros de descarte'], ['/funcionarios', 'Funcionários'],
    ['/esqueci-senha', 'Esqueci minha senha'], ['/rota-inexistente', 'Página não encontrada'],
  ]) {
    const anteriores = new Set(scripts)
    await page.evaluate(destino => { history.pushState(null, '', destino); dispatchEvent(new PopStateEvent('popstate')) }, rota)
    await expect(page.getByRole('heading', { level: 1, name: titulo, exact: true })).toBeVisible()
    const novos = [...scripts].filter(caminho => !anteriores.has(caminho))
    expect(novos.length, rota).toBeGreaterThan(0)
    registro.push({ rota, chunks: novos })
  }
  for (const rota of ['/configuracoes', '/relatorios', '/itens/item-proprio/triagem']) {
    const quantidade = scripts.size
    await page.evaluate(destino => { history.pushState(null, '', destino); dispatchEvent(new PopStateEvent('popstate')) }, rota)
    await expect(page.getByRole('heading', { level: 1, name: 'Acesso restrito', exact: true })).toBeVisible()
    expect(scripts.size, rota).toBe(quantidade)
  }
  await info.attach('chunks-por-rota', { body: JSON.stringify(registro, null, 2), contentType: 'application/json' })
})
