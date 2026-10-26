import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { base, fazerLogin, preparar } from './api-controlada'
import { controlarInventario } from './inventario-controlado'

/** Auth mocks first, then the inventory (later routes win), then the login. */
async function abrir(page: Page, path = '/itens') {
  await preparar(page, 'MANAGER', 0, base, false)
  const inventory = await controlarInventario(page)
  await fazerLogin(page)
  if (path !== '/') await page.getByRole('navigation', { name: 'Seções do sistema' }).getByRole('link', { name: 'Itens' }).click()
  await expect(page.getByRole('heading', { name: 'Gestão de itens', exact: true })).toBeVisible()
  return inventory
}

const dialog = (page: Page) => page.getByRole('dialog')
const rowOf = (page: Page, name: string) => page.getByRole('row').filter({ hasText: name })

async function fillRequired(page: Page, barcode: string, over: { name?: string; usage?: string } = {}) {
  const form = dialog(page)
  await form.getByLabel('Código de barras').fill(barcode)
  await form.getByLabel('Selecione o modelo').selectOption('model-1')
  await form.getByLabel('Nome do item').fill(over.name ?? 'Notebook novo')
  await form.getByLabel('Condição').selectOption('USED')
  await form.getByLabel('Não', { exact: true }).check()
  await form.getByLabel('Intensidade de uso (0 a 10)').fill(over.usage ?? '5')
}

test('lista os itens ativos com as colunas do Figma e paginação do servidor (BR-15, T-15)', async ({ page }) => {
  const inventory = await abrir(page)
  const table = page.getByRole('table', { name: 'Todos os itens' })
  await expect(table.getByRole('columnheader')).toHaveText(['Item', 'Categoria', 'Status', 'Responsável', 'Atualização', 'Ação'])
  await expect(table.getByRole('row')).toHaveCount(21)
  await expect(rowOf(page, 'Impressora removida')).toHaveCount(0)
  await expect(page.getByText('47 resultados · página 1 de 3')).toBeVisible()
  expect(inventory.lists.at(-1)?.toString()).toBe('page=0&size=20')

  await page.getByRole('button', { name: 'Próxima' }).click()
  await expect(page).toHaveURL(/page=1/)
  await expect(page.getByText('página 2 de 3')).toBeVisible()
  expect(inventory.lists.at(-1)?.get('page')).toBe('1')
  await page.getByLabel('Por página').selectOption('50')
  await expect(page.getByText('página 1 de 1')).toBeVisible()
  // Never more than the server's maximum, and never one request per page to fill a client-side table.
  expect(Math.max(...inventory.lists.map((list) => Number(list.get('size'))))).toBeLessThanOrEqual(100)
})

test('busca, status e categoria são filtros do servidor refletidos na URL (T-15)', async ({ page }) => {
  const inventory = await abrir(page)
  await page.getByRole('searchbox', { name: /Pesquisar/ }).fill('Tablet')
  await expect(rowOf(page, 'Tablet pendente')).toBeVisible()
  await expect(page).toHaveURL(/q=Tablet/)
  await expect.poll(() => inventory.lists.at(-1)?.get('q')).toBe('Tablet')
  await page.getByRole('button', { name: 'Limpar filtros' }).click()
  await page.getByLabel('Status').selectOption('REMOVED')
  await expect(rowOf(page, 'Impressora removida')).toBeVisible()
  await expect(page).toHaveURL(/status=REMOVED/)
  await page.reload()
  await expect(page.getByLabel('Status')).toHaveValue('REMOVED')
  await page.getByLabel('Status').selectOption('')
  await page.getByLabel('Categoria').selectOption('cat-moveis')
  await expect(page.getByRole('row')).toHaveCount(2)
  await page.getByRole('searchbox', { name: /Pesquisar/ }).fill('zzzz')
  await expect(page.getByRole('heading', { name: 'Nenhum item encontrado' })).toBeVisible()
})

test('T-10: cadastrar = POST /items e depois /submit; o id nasce no cliente e a unidade vai só no header (BR-09, BR-10)', async ({ page }) => {
  const inventory = await abrir(page)
  await page.getByRole('button', { name: 'Adicionar item' }).click()
  await expect(dialog(page)).toBeVisible()
  await fillRequired(page, 'NOVO-1')
  await dialog(page).getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item cadastrado e incluído no estoque.' })).toBeVisible()
  await expect(dialog(page)).toBeHidden()
  const [create, submit] = inventory.writes
  expect(create).toMatchObject({ method: 'POST', path: '/api/v1/items', body: { barcode: 'NOVO-1', modelId: 'model-1', name: 'Notebook novo', condition: 'USED', hasDamages: false, usageIntensity: 5 } })
  expect(create.body).not.toHaveProperty('unitId')
  expect(create.body).not.toHaveProperty('status')
  expect(create.body?.id).toMatch(/^[0-9a-f-]{36}$/)
  expect(submit).toMatchObject({ method: 'POST', path: `/api/v1/items/${create.body?.id}/submit` })
  expect(inventory.items.find((item) => item.id === create.body?.id)?.status).toBe('IN_STOCK')
})

test('T-10: novo modelo viaja junto com o item, e o modelo existente não (BR-10, BR-11)', async ({ page }) => {
  const inventory = await abrir(page)
  await page.getByRole('button', { name: 'Adicionar item' }).click()
  const form = dialog(page)
  await form.getByLabel('Código de barras').fill('NOVO-2')
  await form.getByLabel('Novo modelo', { exact: true }).check()
  await form.getByLabel(/^Categoria/).selectOption('cat-eletronicos')
  await form.getByLabel('Nome do modelo').fill('Galaxy Tab')
  await form.getByLabel('Fabricante').fill('Samsung')
  await form.getByLabel('Plástico').check()
  await form.getByLabel('Peso estimado (kg)').fill('0.5')
  await form.getByLabel('Nome do item').fill('Tablet novo')
  await form.getByLabel('Condição').selectOption('NEW')
  await form.getByLabel('Não', { exact: true }).check()
  await form.getByLabel('Intensidade de uso (0 a 10)').fill('0')
  await form.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(dialog(page)).toBeHidden()
  expect(inventory.writes[0].body).toMatchObject({ model: { name: 'Galaxy Tab', manufacturer: 'Samsung', categoryId: 'cat-eletronicos', materials: ['PLASTIC'], estimatedWeightKg: 0.5 }, usageIntensity: 0 })
  expect(inventory.writes[0].body).not.toHaveProperty('modelId')
})

test('T-11: dados inválidos não saem do navegador e cada erro aparece no campo (BR-11)', async ({ page }) => {
  const inventory = await abrir(page)
  await page.getByRole('button', { name: 'Adicionar item' }).click()
  const form = dialog(page)
  await form.getByRole('button', { name: 'Concluir cadastro' }).click()
  for (const message of ['Informe o código de barras.', 'Selecione o modelo ou cadastre um novo.', 'Informe o nome do item.', 'Selecione a condição.', 'Informe se o item tem danos.', 'Informe a intensidade de uso (0 a 10).']) {
    await expect(form.getByText(message)).toBeVisible()
  }
  await expect(form.getByLabel('Código de barras')).toHaveAttribute('aria-invalid', 'true')
  await expect(form.getByLabel('Código de barras')).toBeFocused()
  await form.getByLabel('Sim', { exact: true }).check()
  await form.getByLabel('Intensidade de uso (0 a 10)').fill('11')
  await form.getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(form.getByText('Selecione ao menos um tipo de dano.')).toBeVisible()
  await expect(form.getByText('Informe um número inteiro de 0 a 10.')).toBeVisible()
  expect(inventory.writes).toEqual([])
})

test('T-11: código de barras repetido (409) volta como erro do campo, sem submit', async ({ page }) => {
  const inventory = await abrir(page)
  await page.getByRole('button', { name: 'Adicionar item' }).click()
  await fillRequired(page, 'BAR-item-1')
  await dialog(page).getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(dialog(page).getByText('Já existe um item com este código de barras.')).toBeVisible()
  expect(inventory.writes.map((write) => write.path)).toEqual(['/api/v1/items'])
  await dialog(page).getByLabel('Código de barras').fill('BAR-livre')
  await dialog(page).getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(dialog(page)).toBeHidden()
  // The same form id is reused, so the retry cannot duplicate the item.
  expect(inventory.writes[0].body?.id).toBe(inventory.writes[1].body?.id)
})

test('T-10: submit com 422 deixa o rascunho, aponta o que falta e continua em modo edição (BR-10)', async ({ page }) => {
  const inventory = await abrir(page)
  inventory.fail['POST /submit'] = 422
  await page.getByRole('button', { name: 'Adicionar item' }).click()
  await fillRequired(page, 'NOVO-3')
  await dialog(page).getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(dialog(page).getByRole('heading', { name: /Editar item/ })).toBeVisible()
  await expect(dialog(page).getByRole('alert').filter({ hasText: 'Faltam: Intensidade de uso.' })).toBeVisible()
  await dialog(page).getByLabel('Intensidade de uso (0 a 10)').fill('7')
  await dialog(page).getByRole('button', { name: 'Salvar e concluir cadastro' }).click()
  await expect(dialog(page)).toBeHidden()
  expect(inventory.writes.map((write) => `${write.method} ${write.path.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/, ':id')}`)).toEqual(['POST /api/v1/items', 'POST /api/v1/items/:id/submit', 'PATCH /api/v1/items/:id', 'POST /api/v1/items/:id/submit'])
})

test('T-12: editar envia só o que mudou e o "Limpar" apaga com string vazia (BR-12)', async ({ page }) => {
  const inventory = await abrir(page)
  inventory.items.find((item) => item.id === 'item-1')!.serialNumber = 'SN-1'
  await page.reload()
  await page.getByRole('button', { name: 'Editar Item 01' }).click()
  const form = dialog(page)
  await expect(form.getByLabel('Nome do item')).toHaveValue('Item 01')
  await form.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(dialog(page)).toBeHidden()
  expect(inventory.writes).toEqual([])

  await page.getByRole('button', { name: 'Editar Item 01' }).click()
  await form.getByLabel('Nome do item').fill('Item 01 revisado')
  await form.getByRole('button', { name: 'Limpar' }).first().click()
  await expect(form.getByLabel('Número de série')).toHaveValue('')
  await form.getByRole('button', { name: 'Salvar alterações' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item atualizado.' })).toBeVisible()
  expect(inventory.writes).toEqual([{ method: 'PATCH', path: '/api/v1/items/item-1', body: { name: 'Item 01 revisado', serialNumber: '' } }])
  await expect(rowOf(page, 'Item 01 revisado')).toBeVisible()
})

test('editar com alterações pendentes pede confirmação ao fechar', async ({ page }) => {
  await abrir(page)
  await page.getByRole('button', { name: 'Editar Item 01' }).click()
  await dialog(page).getByLabel('Nome do item').fill('Outro nome')
  const prompts: string[] = []
  page.once('dialog', async (native) => { prompts.push(native.message()); await native.dismiss() })
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeVisible()
  page.once('dialog', (native) => { prompts.push(native.message()); void native.accept() })
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeHidden()
  expect(prompts).toEqual(['Descartar as alterações?', 'Descartar as alterações?'])
  await expect(page.getByRole('button', { name: 'Editar Item 01' })).toBeFocused()
})

test('T-13: remover pede confirmação, é lógico e pode ser restaurado (BR-13)', async ({ page }) => {
  const inventory = await abrir(page)
  await page.getByRole('button', { name: 'Remover Item 01' }).click()
  await expect(dialog(page)).toContainText('pode ser restaurado')
  await dialog(page).getByRole('button', { name: 'Cancelar' }).click()
  expect(inventory.writes).toEqual([])
  await page.getByRole('button', { name: 'Remover Item 01' }).click()
  await dialog(page).getByRole('button', { name: 'Remover', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item removido.' })).toBeVisible()
  expect(inventory.writes).toEqual([{ method: 'DELETE', path: '/api/v1/items/item-1', body: undefined }])
  await expect(rowOf(page, 'Item 01')).toHaveCount(0)

  await page.getByLabel('Status').selectOption('REMOVED')
  await expect(rowOf(page, 'Item 01')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Remover Item 01' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Restaurar Item 01' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item restaurado.' })).toBeVisible()
  expect(inventory.writes.at(-1)).toMatchObject({ method: 'POST', path: '/api/v1/items/item-1/restore' })
})

test('T-14: aprovar e reprovar (motivo obrigatório) só existem para item em aprovação (BR-14)', async ({ page }) => {
  const inventory = await abrir(page)
  await expect(rowOf(page, 'Item 01').getByRole('button', { name: /Aprovar/ })).toHaveCount(0)
  await rowOf(page, 'Tablet pendente').getByRole('button', { name: 'Reprovar Tablet pendente' }).click()
  await dialog(page).getByRole('button', { name: 'Reprovar', exact: true }).click()
  await expect(dialog(page).getByText('Informe o motivo da reprovação.')).toBeVisible()
  expect(inventory.writes).toEqual([])
  await dialog(page).getByLabel('Motivo').fill('Foto ilegível')
  await expect(dialog(page).getByText('13/500 caracteres')).toBeVisible()
  await dialog(page).getByRole('button', { name: 'Reprovar', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item reprovado.' })).toBeVisible()
  expect(inventory.writes).toEqual([{ method: 'POST', path: '/api/v1/items/item-pending/reject', body: { reason: 'Foto ilegível' } }])
  expect(inventory.items.find((item) => item.id === 'item-pending')?.status).toBe('REJECTED')
})

test('T-14: aprovar leva o item ao estoque; 409 recarrega e avisa que o item mudou', async ({ page }) => {
  const inventory = await abrir(page)
  inventory.fail['POST /approve'] = 409
  await page.getByRole('button', { name: 'Aprovar Tablet pendente' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'O item mudou desde a última leitura' })).toBeVisible()
  await expect(rowOf(page, 'Tablet pendente').getByRole('button', { name: /Aprovar/ })).toBeVisible()
  await page.getByRole('button', { name: 'Aprovar Tablet pendente' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item aprovado e incluído no estoque.' })).toBeVisible()
  await expect(rowOf(page, 'Tablet pendente')).toContainText('Em estoque')
})

test('rascunho mostra "Concluir cadastro" e leva o item ao estoque (BR-10)', async ({ page }) => {
  const inventory = await abrir(page)
  await expect(rowOf(page, 'Monitor rascunho')).toContainText('Rascunho')
  await page.getByRole('button', { name: 'Concluir cadastro Monitor rascunho' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Falta' }).or(page.getByRole('status').filter({ hasText: 'Faltam' }))).toBeVisible()
  expect(inventory.writes[0]).toMatchObject({ method: 'POST', path: '/api/v1/items/item-draft/submit' })
})

test('detalhe: dados, "—" para o que falta, histórico paginado e as mesmas ações', async ({ page }) => {
  await abrir(page)
  await rowOf(page, 'Tablet pendente').getByRole('link', { name: 'Tablet pendente' }).click()
  await expect(page).toHaveURL(/\/itens\/item-pending$/)
  await expect(page.getByRole('heading', { name: 'Tablet pendente', level: 1 })).toBeVisible()
  await expect(page.getByText('Em aprovação').first()).toBeVisible()
  await expect(page.getByText('Cadeira Ergo — Flexform')).toBeVisible()
  await expect(page.getByText('Sem previsão')).toBeVisible()
  await expect(page.getByText('Sem foto enviada pelo app')).toBeVisible()
  const history = page.getByRole('region', { name: 'Histórico' })
  await expect(history).toContainText('Item cadastrado')
  await expect(history).toContainText('Rascunho → Em aprovação')
  await page.getByRole('button', { name: 'Aprovar Tablet pendente' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Item aprovado' })).toBeVisible()
  await expect(page.getByText('Em estoque').first()).toBeVisible()
  await page.getByRole('link', { name: 'Voltar para itens' }).click()
  await expect(page.getByRole('heading', { name: 'Gestão de itens', exact: true })).toBeVisible()
})

test('detalhe de item inexistente explica o que houve', async ({ page }) => {
  await abrir(page)
  await page.evaluate(() => { history.pushState(null, '', '/itens/nao-existe'); dispatchEvent(new PopStateEvent('popstate')) })
  await expect(page.getByRole('alert').filter({ hasText: 'Não encontramos este item.' })).toBeVisible()
})

test('T-04: nenhuma tela chama pontos de reciclagem ou descarte (BR-03, BR-04)', async ({ page }) => {
  const forbidden: string[] = []
  page.on('request', (request) => { if (/recycling-places|\/disposals|latitude|longitude/i.test(request.url())) forbidden.push(request.url()) })
  await abrir(page)
  await rowOf(page, 'Item 02').getByRole('link', { name: 'Item 02' }).click()
  await expect(page.getByRole('heading', { name: 'Item 02', level: 1 })).toBeVisible()
  await page.getByRole('link', { name: 'Voltar para itens' }).click()
  await page.getByRole('button', { name: 'Adicionar item' }).click()
  await expect(dialog(page).getByText(/latitude|longitude|descarte/i)).toHaveCount(0)
  expect(forbidden).toEqual([])
})

test('acessibilidade: lista, formulário aberto e detalhe sem violações graves (axe)', async ({ page }) => {
  await abrir(page)
  const serious = async () => (await new AxeBuilder({ page }).analyze()).violations.filter((item) => item.impact === 'critical' || item.impact === 'serious').map((item) => `${item.id}: ${item.nodes.map((node) => node.target.join(' ')).join(' | ')}`)
  expect(await serious()).toEqual([])
  await page.getByRole('button', { name: 'Adicionar item' }).click()
  await dialog(page).getByRole('button', { name: 'Concluir cadastro' }).click()
  await expect(dialog(page).getByText('Informe o nome do item.')).toBeVisible()
  expect(await serious()).toEqual([])
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeHidden()
  await rowOf(page, 'Item 03').getByRole('link', { name: 'Item 03' }).click()
  await expect(page.getByRole('heading', { name: 'Item 03', level: 1 })).toBeVisible()
  expect(await serious()).toEqual([])
})
